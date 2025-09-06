export {}

enum ChannelType {
  EMAIL = "EMAIL",
  SMS = "SMS",
}

enum Status {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

class NotificationRequest {
  constructor(
    public id: string,
    public userId: string,
    public title: string,
    public message: string,
    public channelType: ChannelType,
    public status: Status = Status.PENDING
  ) {}
}

interface IChannelSender {
  send(req: NotificationRequest): Promise<boolean>;
}

class EmailSender implements IChannelSender {
  async send(req: NotificationRequest): Promise<boolean> {
    console.log(`Sending email notification: title: ${req.title}, message: ${req.message}`);
    return true;
  }
}

class SMSSender implements IChannelSender {
  async send(req: NotificationRequest): Promise<boolean> {
    console.log(`Sending email notification: title: ${req.title}, message: ${req.message}`);
    return true;
  }
}

class NotificationRepo {
  private storage: Record<string, NotificationRequest> = {};

  async save(req: NotificationRequest) {
    this.storage[req.id] = req;
  }

  async update(req: NotificationRequest) {
    this.storage[req.id] = req;
  }

  async get(id: string) {
    return this.storage[id];
  }
}

class NotificationService {
  private channelMap;
  constructor(private notificationRepo: NotificationRepo, emailSender: EmailSender, smsSender: SMSSender) {
    this.channelMap = {
      [ChannelType.EMAIL]: emailSender,
      [ChannelType.SMS]: smsSender
    };
  }

  async sendNotification(req: NotificationRequest): Promise<void> {
    try {
      await this.notificationRepo.save(req);
      const sender = this.channelMap[req.channelType];
      await sender.send(req);
      req.status = Status.SENT;
    } catch (err) {
      req.status = Status.FAILED;
      console.log('Error', err);
    } finally {
      this.notificationRepo.update(req);
    }
  }
}

(async () => {
  const emailSender = new EmailSender();
  const smsSender = new SMSSender();
  const notificationRepo = new NotificationRepo();
  const notificationService = new NotificationService(notificationRepo, emailSender, smsSender);

  const not1 = new NotificationRequest('1', 'user1', 'First notification', 'some text 1', ChannelType.EMAIL);
  const not2 = new NotificationRequest('2', 'user2', 'First notification', 'some text 2', ChannelType.SMS);

  await notificationService.sendNotification(not1);
  await notificationService.sendNotification(not2);
})();
