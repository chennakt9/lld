import readline from 'readline';

export {}
const WIDTH = 20;
const HEIGHT = 10;
const TICK_RATE = 500; // ms

type Point = { x: number, y: number };

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
};

class Food {
  position: Point;

  constructor(private gridWidth: number, private gridHeight: number, private snake: Snake) {
    this.position = this.generatePosition();
  }

  private generatePosition(): Point {
    let pos: Point;
    do {
      pos = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight),
      };
    } while (this.snake.selfCrash(pos));
    return pos;
  }

  respawn() {
    this.position = this.generatePosition();
  }
}

class Snake {
  body: Point[] = [{x: 5, y: 5}];

  constructor(private rows: number, private cols: number) {}

  move(direction: Direction) {
    const head = this.body[0];
    const newHead = { ...head };

    switch(direction) {
      case Direction.UP:
        newHead.x--;
        break;
      case Direction.DOWN:
        newHead.x++;
        break;
      case Direction.LEFT:
        newHead.y--;
        break;
      case Direction.RIGHT:
        newHead.y++;
        break;
    }

    if (this.crossBoundaries(newHead) || this.selfCrash(newHead)) {
      return false;
    }

    this.body.unshift(newHead);
    this.body.pop();
    return true;
  }

  crossBoundaries(newHead: Point) {
    return newHead.x < 0 || newHead.x >= this.rows || newHead.y < 0 || newHead.y >= this.cols;
  }

  selfCrash(newHead: Point) {
    return this.body.some(segment => segment.x === newHead.x && segment.y === newHead.y);
  }

  grow() {
    const tail = this.body[this.body.length - 1];
    this.body.push({ ...tail }); // grow by duplicating tail
  }
}

class Game {
  public snake: Snake;
  food: Food;
  interval: NodeJS.Timeout | null = null;
  direction: Direction = Direction.DOWN;
  lastDirection: Direction = Direction.DOWN;

  constructor(private rows: number, private cols: number) {
    this.snake = new Snake(rows, cols);
    this.food = new Food(rows, cols, this.snake);
    this.setupInput();
  }

  start() {
    console.clear();
    this.interval = setInterval(() => this.gameLoop(), TICK_RATE);
  }

  gameLoop() {
    const success = this.snake.move(this.direction);

    if (!success) {
      this.endGame();
      return;
    }

    const head = this.snake.body[0];
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.snake.grow();
      this.food.respawn();
    }

    this.render();
  }

  render() {
    const grid: string[][] = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ' ')
    );

    for (const segment of this.snake.body) {
      grid[segment.x][segment.y] = '🟩';
    }

    const { x: fx, y: fy } = this.food.position;
    grid[fx][fy] = '🍎';

    console.clear();
    console.log('=== Snake Game ===');
    console.log(grid.map((row) => row.join('')).join('\n'));
    console.log('\nUse arrow keys to steer the snake.');
  }

  setupInput() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (_, key) => {
      if (!key) return;

      const isOpposite = (a: Direction, b: Direction) => {
        return (
          (a === Direction.UP && b === Direction.DOWN) ||
          (a === Direction.DOWN && b === Direction.UP) ||
          (a === Direction.LEFT && b === Direction.RIGHT) ||
          (a === Direction.RIGHT && b === Direction.LEFT)
        );
      };

      if (key.name === 'up' && !isOpposite(this.direction, Direction.UP)) this.direction = Direction.UP;
      else if (key.name === 'down' && !isOpposite(this.direction, Direction.DOWN)) this.direction = Direction.DOWN;
      else if (key.name === 'left' && !isOpposite(this.direction, Direction.LEFT)) this.direction = Direction.LEFT;
      else if (key.name === 'right' && !isOpposite(this.direction, Direction.RIGHT)) this.direction = Direction.RIGHT;
      else if (key.name === 'c' && key.ctrl) {
        this.endGame();
      }
    });
  }

  endGame() {
    if (this.interval) clearInterval(this.interval);
    console.clear();
    console.log('💀 Game Over!');
    console.log(`Your Score: ${this.snake.body.length - 1}`);
    process.exit(0);
  }
}

const game = new Game(WIDTH, HEIGHT);
game.start();
