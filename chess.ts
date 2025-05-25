export {}

enum Color {
  WHITE = 'white',
  BLACK = 'black'
}

interface MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][];
}

class Piece {
  constructor(
    public color: Color,
    public row: number,
    public col: number,
    private strategy: MoveStrategy
  ) {}

  getPossibleMoves(board: Board) {
    return this.strategy.getPossibleMoves(this, board);
  }

  isOpponent(target: Piece | null) {
    return target !== null && target !== undefined && target.color === this.color;
  }

  moveTo(row: number, col: number) {
    this.row = row;
    this.col = col;
  }
}

class KnightStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];

    const possibleMoves: [number, number][] = [];
    for (let [r, c] of offsets) {
      const dr = piece.row + r; const dc = piece.col + c;

      if (!board.isValidCell(dr, dc)) {
        continue;
      }

      if (board.isCellEmpty(dr, dc) || piece.isOpponent(board.grid[dr][dc])) {
        possibleMoves.push([dr, dc]);
      }
    }

    return possibleMoves;
  }
}

class RookStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const offsets: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return board.getLinearMoves(piece, offsets);
  }
}

class BishopStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const offsets: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return board.getLinearMoves(piece, offsets);
  }
}

class QueenStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const offsets: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    return board.getLinearMoves(piece, offsets);
  }
}

class KingStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];

    const possibleMoves: [number, number][] = [];
    for (let [r, c] of offsets) {
      const dr = piece.row + r; const dc = piece.col + c;

      if (!board.isValidCell(dr, dc)) {
        continue;
      }

      if (board.isCellEmpty(dr, dc) || piece.isOpponent(board.grid[dr][dc])) {
        possibleMoves.push([dr, dc]);
      }
    }

    return possibleMoves;
  }
}

class PawnStrategy implements MoveStrategy {
  getPossibleMoves(piece: Piece, board: Board): [number, number][] {
    const dir = piece.color === 'white' ? -1 : 1;

    const possibleMoves: [number, number][] = [];
    
    if (board.isCellEmpty(piece.row + dir, piece.col)) {
      possibleMoves.push([piece.row + dir, piece.col]);

      const startRow = piece.color === 'white' ? 6 : 1;
      if (piece.row === startRow && board.isCellEmpty(piece.row + 2 * dir, piece.col)) {
        possibleMoves.push([piece.row + 2 * dir, piece.col]);
      }
    }

    for (const dc of [-1, 1]) {
      if (piece.isOpponent(board.grid[piece.row + dir][piece.col + dc])) {
        possibleMoves.push([piece.row + dir, piece.col + dc]);
      }
    }

    return possibleMoves;
  }
}

class Board {
  public grid: (Piece | null)[][] = [];
  constructor() {
    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 8; j++) {
        row.push(null);
      }
      this.grid.push(row);
    }

    this.setup();
  }

  setup() {
    const backRow = [
      (c: Color, r: number, col: number) => new Piece(c, r, col, new RookStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new KnightStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new BishopStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new QueenStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new KingStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new BishopStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new KnightStrategy()),
      (c: Color, r: number, col: number) => new Piece(c, r, col, new RookStrategy()),
    ];

    for (let i = 0; i < 8; i++) {
      this.grid[0][i] = backRow[i](Color.BLACK, 0, i);
      this.grid[1][i] = new Piece(Color.BLACK, 1, i, new PawnStrategy());
      this.grid[6][i] = new Piece(Color.WHITE, 6, i, new PawnStrategy());
      this.grid[7][i] = backRow[i](Color.WHITE, 7, i);
    }
  }

  isValidCell(row: number, col: number) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  isCellEmpty(row: number, col: number) {
    return this.grid[row][col] === null;
  }

  movePiece(from: [number, number], to: [number, number]): boolean {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const piece = this.grid[fr][fc];

    if (!piece) return false;

    const validMoves = piece.getPossibleMoves(this);
    if (!validMoves.some(([r, c]) => r === tr && c === tc)) return false;

    this.grid[tr][tc] = piece;
    this.grid[fr][fc] = null;
    piece.moveTo(tr, tc);
    return true;
  }

  getLinearMoves(piece: Piece, directions: [number, number][]): [number, number][] {
    const possibleMoves: [number, number][] = [];

    for (const [dr, dc] of directions) {
      let r = piece.row + dr;
      let c = piece.col + dc;

      while (this.isValidCell(r, c)) {
        if (!this.isCellEmpty(r, c)) {
          if (piece.isOpponent(this.grid[r][c])) {
            possibleMoves.push([r, c]);
          }
          break;
        }

        possibleMoves.push([r, c]);
        r += dr;
        c += dc;
      }
    }

    return possibleMoves;
  }
}

class Game {
  public board: Board = new Board();
  public turn: Color = Color.WHITE;

  algebraToCoord(pos: string): [number, number] {
    const file = pos[0].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(pos[1]);
    return [rank, file];
  }

  playMove(from: string, to: string): boolean {
    const [fr, fc] = this.algebraToCoord(from);
    const [tr, tc] = this.algebraToCoord(to);
    const piece = this.board.grid[fr][fc];

    if (!piece || piece.color !== this.turn) {
      console.log("Invalid piece or not your turn.");
      return false;
    }

    const moved = this.board.movePiece([fr, fc], [tr, tc]);
    if (moved) {
      console.log(`Moved ${from} to ${to}`);

      if (this.isWin()) {
        console.log(`${this.turn === Color.WHITE ? 'Black' : 'White'} wins!`);
      } else if (this.isDraw()) {
        console.log("It's a draw!");
      }

      // Only change turn if game is not over
      this.turn = this.turn === Color.WHITE ? Color.BLACK : Color.WHITE;
    } else {
      console.log("Illegal move");
    }

    return moved;
  }

  isInCheck(color: Color): boolean {
    let kingPosition: [number, number] | null = null;

    // Find the king's position
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board.grid[r][c];
        if (
          piece &&
          piece.color === color &&
          (piece as Piece)['strategy'] instanceof KingStrategy
        ) {
          kingPosition = [r, c];
          break;
        }
      }
    }

    if (!kingPosition) return false;

    const [kr, kc] = kingPosition;

    // Check if any opposing piece can move to the king's position
    for (let row of this.board.grid) {
      for (let piece of row) {
        if (piece && piece.color !== color) {
          const moves = piece.getPossibleMoves(this.board);
          if (moves.some(([r, c]) => r === kr && c === kc)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isWin(): boolean {
    const opponentColor = this.turn === Color.WHITE ? Color.BLACK : Color.WHITE;

    if (!this.isInCheck(opponentColor)) return false;

    // If opponent is in check and has no legal moves, it's checkmate
    for (let row of this.board.grid) {
      for (let piece of row) {
        if (piece && piece.color === opponentColor) {
          const moves = piece.getPossibleMoves(this.board);

          for (const [r, c] of moves) {
            const originalPos = [piece.row, piece.col];
            const targetPiece = this.board.grid[r][c];

            // Try the move
            this.board.grid[piece.row][piece.col] = null;
            this.board.grid[r][c] = piece;
            piece.moveTo(r, c);

            const stillInCheck = this.isInCheck(opponentColor);

            // Undo move
            this.board.grid[r][c] = targetPiece;
            this.board.grid[originalPos[0]][originalPos[1]] = piece;
            piece.moveTo(originalPos[0], originalPos[1]);

            if (!stillInCheck) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  isDraw(): boolean {
    // Check if current player has no legal moves
    for (let row of this.board.grid) {
      for (let cell of row) {
        if (cell && cell.color === this.turn) {
          const moves = cell.getPossibleMoves(this.board);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  printBoard() {
    console.log("Current board:");
    for (let row of this.board.grid) {
      console.log(row.map(cell => {
        if (!cell) return '.';
        if (cell instanceof Piece) {
          const strategy = (cell as Piece)['strategy'];
          if (strategy instanceof PawnStrategy) return cell.color === Color.WHITE ? 'P' : 'p';
          if (strategy instanceof RookStrategy) return cell.color === Color.WHITE ? 'R' : 'r';
          if (strategy instanceof KnightStrategy) return cell.color === Color.WHITE ? 'N' : 'n';
          if (strategy instanceof BishopStrategy) return cell.color === Color.WHITE ? 'B' : 'b';
          if (strategy instanceof QueenStrategy) return cell.color === Color.WHITE ? 'Q' : 'q';
          if (strategy instanceof KingStrategy) return cell.color === Color.WHITE ? 'K' : 'k';
        }
        return '?';
      }).join(' '));
    }
    console.log('\n');
  }
}


const game = new Game();
game.printBoard();
game.playMove('e2', 'e4');
game.printBoard();
game.playMove('e7', 'e5');
game.printBoard();
game.playMove('g1', 'f3');
game.printBoard();
