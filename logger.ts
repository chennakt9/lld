export {}
enum LogLevelEnum {
    DEBUG = 1,
    INFO = 2,
    ERROR = 3
}

class LogMessage {
  constructor(
    public readonly level: LogLevelEnum,
    public readonly message: string,
    public readonly timestamp: number = Date.now()
  ) {}

  toString(): string {
    return `[${LogLevelEnum[this.level]}] ${this.timestamp} - ${this.message}`;
  }
}

interface LogAppenderStrategy {
    append(logMessage: LogMessage): void;
}

class ConsoleAppender implements LogAppenderStrategy {
  append(logMessage: LogMessage): void {
    console.log(logMessage.toString());
  }
}

class FileAppender implements LogAppenderStrategy {
  private file: LogMessage[] = [];
  append(logMessage: LogMessage): void {
    this.file.push(logMessage);
  }
}

abstract class LogHandler {
  protected nextLogger: LogHandler | null = null;

  constructor(
    protected level: LogLevelEnum,
    protected appender: LogAppenderStrategy
  ) {}

  setNextLogger(logger: LogHandler) {
    this.nextLogger = logger;
  }

  logMessage(level: LogLevelEnum, message: string) {
    if (this.level >= level) {
      const logMsg = new LogMessage(level, message);
      this.appender.append(logMsg);
    } else {
      this.nextLogger?.logMessage(level, message);
    }
  }
}

class InfoLogger extends LogHandler {}

class DebugLogger extends LogHandler {}

class ErrorLogger extends LogHandler {}

function getChainOfLoggers(appender: LogAppenderStrategy): LogHandler {
  const errorLogger = new ErrorLogger(LogLevelEnum.ERROR, appender);
  const infoLogger = new InfoLogger(LogLevelEnum.INFO, appender);
  const debugLogger = new DebugLogger(LogLevelEnum.DEBUG, appender);

  debugLogger.setNextLogger(infoLogger);
  infoLogger.setNextLogger(errorLogger);

  return debugLogger;
}

const consoleAppender = new ConsoleAppender();

const logger = getChainOfLoggers(consoleAppender);

console.log("Logging INFO level message:");
logger.logMessage(LogLevelEnum.INFO, "This is an information.");

console.log("\nLogging DEBUG level message:");
logger.logMessage(LogLevelEnum.DEBUG, "This is a debug level information.");

console.log("\nLogging ERROR level message:");
logger.logMessage(LogLevelEnum.ERROR, "This is an error information.");
