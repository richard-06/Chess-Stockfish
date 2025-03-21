import { Chess } from "chess.js";
import React, { useEffect, useRef, useState } from "react";
import { createStockfishWorker } from "./utils/stockfishWorker";

import { Button } from "antd";

const pieceMap = {
  r: "b_r",
  n: "b_h",
  b: "b_b",
  q: "b_q",
  k: "b_k",
  p: "b_p",
  R: "w_r",
  N: "w_h",
  B: "w_b",
  Q: "w_q",
  K: "w_k",
  P: "w_p",
};

// Function to parse FEN's piece placement part into an 8x8 array.
function parseFEN(fen) {
  // FEN format: "piecePlacement activeColor castling enPassant halfmove fullmove"
  const [piecePlacement] = fen.split(" ");
  const rows = piecePlacement.split("/");

  return rows.map((row) => {
    const squares = [];
    for (const char of row) {
      if (isNaN(char)) {
        squares.push(char);
      } else {
        // If char is a digit, push that many empty squares ('')
        for (let i = 0; i < Number(char); i++) {
          squares.push("");
        }
      }
    }
    return squares;
  });
}

const ChessBoard = ({ fen, setGame, game }) => {
  const [bestMove, setBestMove] = useState(null);
  const [highLight, setHighLight] = useState([]);
  const [trigger, setTrigger] = useState(false);
  const [moves, setMoves] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [buttonResolver, setButtonResolver] = useState(null);
  const [player, setPlayer] = useState(true);

  const stockfish = useRef(null);

  useEffect(() => {
    // Initialize Stockfish worker

    stockfish.current = createStockfishWorker();
    if (!stockfish.current) return;

    // Listen for messages from Stockfish
    stockfish.current.onmessage = (event) => {
      const message = event.data;
      console.log("Stockfish says:", message);

      // Extract the best move from Stockfish's response
      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1]; // Extract move
        setBestMove(() => {
          return move;
        });
      }
    };

    return () => {
      if (stockfish.current) {
        stockfish.current.terminate();
      }
    };
  }, []);

  // Function to send the FEN position to Stockfish
  const getBestMove = () => {
    if (!stockfish.current) return;

    stockfish.current.postMessage(`position fen ${fen}`);
    stockfish.current.postMessage("go depth 15"); // Set calculation depth
  };
  // Convert FEN to a board array (8x8)
  const board = parseFEN(fen);
  console.log("board:" + board);

  const pos = [
    "a8",
    "b8",
    "c8",
    "d8",
    "e8",
    "f8",
    "g8",
    "h8",
    "a7",
    "b7",
    "c7",
    "d7",
    "e7",
    "f7",
    "g7",
    "h7",
    "a6",
    "b6",
    "c6",
    "d6",
    "e6",
    "f6",
    "g6",
    "h6",
    "a5",
    "b5",
    "c5",
    "d5",
    "e5",
    "f5",
    "g5",
    "h5",
    "a4",
    "b4",
    "c4",
    "d4",
    "e4",
    "f4",
    "g4",
    "h4",
    "a3",
    "b3",
    "c3",
    "d3",
    "e3",
    "f3",
    "g3",
    "h3",
    "a2",
    "b2",
    "c2",
    "d2",
    "e2",
    "f2",
    "g2",
    "h2",
    "a1",
    "b1",
    "c1",
    "d1",
    "e1",
    "f1",
    "g1",
    "h1",
  ];

  async function computeMove() {
    try {
      const move = await getBestMove();
      handleUserMove(move);
      console.log("Best Move:", move);
    } catch (error) {
      console.error(error);
    }
  }

  const handleUserMove = (move) => {
    const newGame = new Chess(game.fen());
    const result = newGame.move(move);
    if (result) {
      setGame(newGame);
      setPlayer((e) => !e);
      console.log("set to false: ", player);
      if (player) {
        computeMove();
      }

      // After the move, get the engine's move
      // getEngineMove();
    }
  };

  const handleClick = async (pos) => {
    //  setTrigger((e)=>!e)
    let posVal = moves.map((item) => {
      if (item.slice(-2, -1) == "=") {
        return item.slice(-4, -2);
      }
      if (item.slice(-3, -2) == "=") {
        return item.slice(-5, -3);
      }
      if (item.slice(-1) == "+" || item.slice(-1) == "#")
        return item.slice(-3, -1);
      return item.slice(-2);
    });
    console.log("moves: ", moves);
    console.log("test: ", pos, posVal);

    if (trigger == false) {
      console.log(game.moves({ square: pos }));
      setHighLight(
        game.moves({ square: pos }).map((item) => {
          if (item.slice(-2, -1) == "=") return item.slice(-4, -2);
          if (item.slice(-3, -2) == "=") {
            return item.slice(-5, -3);
          }
          if (item.slice(-1) == "+" || item.slice(-1) == "#")
            return item.slice(-3, -1);
          return item.slice(-2);
        })
      );
      if (game.moves({ square: pos }).length) {
        // console.log(game.moves({ square: pos }),'true')
        setMoves(game.moves({ square: pos }));
        setTrigger(true);
      }
    } else {
      setTrigger(false);
      // console.log('acc')
      // console.log(moves.map((item)=> item.slice(-2)), pos)
      // console.log(moves.map((item)=> item.slice(-2)).includes(pos))
      if (posVal.includes(pos)) {
        console.log("handle move", posVal, pos);
        if (moves[posVal.indexOf(pos)].includes("=")) {
          const userChoice = await getUserChoice();

          console.log(
            "User selected:",
            userChoice,
            "pos:",
            pos,
            "PosVal",
            posVal,
            "Moves",
            moves,
            "filtered:",
            moves
              .filter((move) => move.includes(pos))
              .filter((move) => move.includes(userChoice))
              .join("")
          );

          handleUserMove(
            moves
              .filter((move) => move.includes(pos))
              .filter((move) => move.includes(userChoice))
              .join("")
          );
        } else {
          handleUserMove(moves[posVal.indexOf(pos)]);
        }
      }
      setHighLight([]);
    }
  };

  function getUserChoice() {
    setShowCard(true);
    return new Promise((resolve) => {
      // Store the resolver to call it later when a button is clicked.
      setButtonResolver(() => resolve);
    });
  }

  // Handler for when a button is clicked.
  function handleButtonClick(choice) {
    if (buttonResolver) {
      buttonResolver(choice); // Resolve the promise with the chosen value.
    }
    setShowCard(false); // Hide the card after selection.
  }

  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "16px",
    display: "inline-block",
    boxShadow: "2px 2px 12px rgba(0,0,0,0.1)",
  };

  return (
    <>
      {showCard && (
        <div className="card" style={cardStyle}>
          <p>Please select an option:</p>
          <button onClick={() => handleButtonClick("Q")}>Queen</button>
          <button onClick={() => handleButtonClick("B")}>Bishop</button>
          <button onClick={() => handleButtonClick("N")}>Night</button>
          <button onClick={() => handleButtonClick("R")}>Rook</button>
        </div>
      )}
      <div className={`board`}>
        {board.flat().map((square, index) => {
          // Determine row and column index for background color alternation
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isDark = (row + col) % 2 === 1;
          return (
            <div
              onClick={() =>
                player ? (showCard ? {} : handleClick(pos[index])) : {}
              }
              key={index}
              className={`square ${isDark ? "dark" : ""} ${
                highLight.includes(pos[index]) ? "high-light" : ""
              } 
           
           `}
            >
              <div>
                {pieceMap[square] ? <Piecer piece={pieceMap[square]} /> : ""}
              </div>
              {/* <div className='pos'>{pos[index]}</div> */}
            </div>
          );
        })}
      </div>
      <div className="button-arrange">
        <Button type="primary" onClick={() => getBestMove()}>
          Get Best Move
        </Button>
        <p>The best move: {bestMove}</p>
      </div>
    </>
  );
};

export default ChessBoard;

// ${bestMove && bestMove[0]+bestMove[1] == pos[index] || bestMove[2]+bestMove[3] == pos[index]?'bestmove':''}

function Piecer({ piece }) {
  return (
    <img
      src={String(`./pieces/${piece}.png`)}
      alt="Piece"
      className="piece"
    ></img>
  );
}
