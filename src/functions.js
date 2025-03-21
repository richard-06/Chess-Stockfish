export function parseFEN(fen) {
    // FEN format: "piecePlacement activeColor castling enPassant halfmove fullmove"
    const [piecePlacement] = fen.split(' ');
    const rows = piecePlacement.split('/');
    
    return rows.map(row => {
      const squares = [];
      for (const char of row) {
        if (isNaN(char)) {
          squares.push(char);
        } else {
          // If char is a digit, push that many empty squares ('')
          for (let i = 0; i < Number(char); i++) {
            squares.push('');
          }
        }
      }
      return squares;
    });
  }