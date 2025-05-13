// Enums for symbols and game state
export {}

/*
  Player
  Cell
  Board
  GameController
*/

enum SymbolType {
  X = "X",
  O = "O"
}

class Player {
  constructor(public name: string, public symbol: SymbolType) {}
}

class Cell {
  value: SymbolType | null = null;

  constructor(public row: number, public col: number) {}

  isEmpty() {
    return this.value === null;
  }
}

class Board {
  private size = 3;
  private grid: Cell[][] = [];

  constructor() {
    for (let row = 0; row < this.size; row++) {
      const curRow: Cell[] = [];
      for (let col = 0; col < this.size; col++) {
        curRow.push(new Cell(row, col));
      }
      this.grid.push(curRow);
    }
  }

  placeSymbol(player: Player, cell: Cell) {
    const gridCell = this.grid[cell.row][cell.col];

    if (gridCell.isEmpty() === false) {
      return false;
    }

    gridCell.value = player.symbol;

    return true;
  }

  checkWin(symbol: SymbolType) {
    const win = (cells: Cell[]) => cells.every((cell) => cell.value === symbol);

    for (let i = 0; i < this.size; i++) {
      const row = this.grid[i];
      const col = this.grid.map((row) => row[i]);

      if (win(row) || win(col)) {
        return true;
      }
    }

    const leftDiag = [];
    const rightDiag = [];
    for (let i = 0; i < this.size; i++) {
      leftDiag.push(this.grid[i][i]);
      rightDiag.push(this.grid[i][this.size - i - 1]);
    }

    if (win(leftDiag) || win(rightDiag)) {
      return true;
    }

    return false;
  }

  reset() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.grid[i][j].value = null;
      }
    }
  }

  print(): void {
    for (let i = 0; i < this.grid.length; i++) {
      const row = [];
      for (let j = 0; j < this.grid[0].length; j++) {
        row.push(this.grid[i][j].value ?? "-");
      }
      console.log(row.join(" "));
    }
  }

  isFull() {
    for (let i = 0; i < this.grid.length; i++) {
      for (let j = 0; j < this.grid.length; j++) {
        if (!this.grid[i][j].value) {
          return false;
        }
      }
    }

    return true;
  }
}

class GameController {
  private board: Board;
  private currentPlayerIndex: number = 0;

  constructor(private players: Player[]) {
    this.board = new Board();
  }

  startGame() {
    console.log('Starting a new game tic tac toe..');
    this.board.reset();
    this.currentPlayerIndex = 0;
    this.board.print();
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  makeMove(cell: Cell) {
    const player = this.players[this.currentPlayerIndex];
    const successful = this.board.placeSymbol(player, cell);

    if (!successful) {
      console.log('Invalid move.. Cell already taken');
      return false;
    }

    console.log(`\n${player.name} places ${player.symbol} at (${cell.row}, ${cell.col})`);
    this.board.print();

    if (this.board.checkWin(player.symbol)) {
      console.log(`${player.name} wins the game`);
      return true;
    }

    if (this.board.isFull()) {
      console.log('It is a draw');
      return false;
    }

    this.currentPlayerIndex = 1 - this.currentPlayerIndex;

    return true;
  }
}

// Driver code
const player1 = new Player("Alice", SymbolType.X);
const player2 = new Player("Bob", SymbolType.O);
const game = new GameController([player1, player2]);

game.startGame();

game.makeMove(new Cell(0, 0)); // Alice
game.makeMove(new Cell(1, 1)); // Bob
game.makeMove(new Cell(0, 1)); // Alice
game.makeMove(new Cell(1, 0)); // Bob
game.makeMove(new Cell(0, 2)); // Alice wins
