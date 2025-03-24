import { Button } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createStockfishWorker } from "./utils/stockfishWorker";
import { parseFEN } from "./functions";
import { Chess } from "chess.js";
import { NavBar } from "./Components/NavBar";
import { ArrowDownOutlined, CaretDownOutlined } from "@ant-design/icons";

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

export function ChessBoard() {
  const [game, setGame] = useState(new Chess());

  const [bestMove, setBestMove] = useState(null);
  const [move, setMove] = useState(false);
  const [moves, setMoves] = useState([]);
  const [select, setSelect] = useState("");
  const board = parseFEN(game.fen());
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

  useEffect(() => {
    if (parseCurrentPlayer(game.fen()) == "b") {
      botMove();
    }
  }, [game]);

  const handleUserMove = (move) => {
    const newGame = new Chess(game.fen());
    const result = newGame.move(move);
    if (result) {
      setGame(newGame);

      // After the move, get the engine's move
      // getEngineMove();
    }
  };

  // Function to send the FEN position to Stockfish
  // Modified getBestMove to return a promise that resolves with the best move.
  const getBestMove = () => {
    return new Promise((resolve, reject) => {
      if (!stockfish.current) {
        reject("Stockfish not initialized");
        return;
      }
      // One-time message listener
      const listener = (event) => {
        const message = event.data;
        console.log("Stockfish says:", message);
        if (message.startsWith("bestmove")) {
          const move = message.split(" ")[1];
          setBestMove(move);
          // Remove the listener so it does not accumulate over multiple calls.
          stockfish.current.removeEventListener("message", listener);
          resolve(move);
        }
      };

      stockfish.current.addEventListener("message", listener);
      stockfish.current.postMessage(`position fen ${game.fen()}`);
      stockfish.current.postMessage("go depth 15");
    });
  };

  const getMoves = (square) => {
    setMoves(game.moves({ square: square }));
    return game.moves({ square: square });
  };

  function parseMove(item) {
    if (item.slice(-2, -1) == "=") return item.slice(-4, -2);
    if (item.slice(-3, -2) == "=") {
      return item.slice(-5, -3);
    }
    if (item.slice(-1) == "+" || item.slice(-1) == "#")
      return item.slice(-3, -1);
    return item.slice(-2);
  }
  function parseCurrentPlayer(fen) {
    return fen.split(" ")[1];
  }

  async function botMove() {
    console.log("ff");
    try {
      const move = await getBestMove();
      handleUserMove(move);
      console.log("Best Move:", move);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="chess">
      <NavBar />
      <div className="dropdown">
        <CaretDownOutlined />
      </div>
      <div className="hide-text"></div>
      <div className="title">
        Chess with <br />
        stockfish Chess-Engine
      </div>
      <p className="note">
        This is a base chess game developed with React.js that leverages
        Stockfish—an open-source chess engine—to calculate the best possible
        moves. Stockfish employs advanced search algorithms, including
        alpha-beta pruning and iterative deepening, alongside sophisticated
        evaluation functions to assess board positions and determine optimal
        moves. To ensure a smooth user experience, the application runs
        Stockfish computations within a web worker. This setup offloads
        intensive chess calculations to a separate thread, keeping the main UI
        thread free and responsive. As a result, React components can
        efficiently handle user interactions without performance bottlenecks,
        ultimately enhancing the overall gameplay experience.
      </p>
      <div className="board-sep">
        <div>
          <div className="button-list">
            <Button className="button-board">New Game</Button>
            <Button className="red-button-board">Resign</Button>
          </div>
          <div className="board">
            {board.flat().map((square, index) => {
              // Determine row and column index for background color alternation
              const row = Math.floor(index / 8);
              const col = index % 8;
              const isDark = (row + col) % 2 === 1;
              return (
                <div
                  key={index}
                  onClick={async () => {
                    if (move) {
                      if (
                        moves
                          .map((item) => parseMove(item))
                          .includes(pos[index])
                      ) {
                        console.log("can move");

                        setMoves([]);
                        setMove(false);
                        handleUserMove(select + pos[index]);
                        setSelect("");
                      } else {
                        setSelect(pos[index]);
                        let val = getMoves(pos[index]);
                        console.log("tst", val);
                        if (val.length == 0) {
                          console.log("ffffff");
                          setMove(false);
                          setSelect("");
                        }
                      }
                      console.log("moess");
                      console.log(
                        moves.map((item) => parseMove(item)),
                        "ss"
                      );
                    } else {
                      let valid = getMoves(pos[index]);
                      if (valid.length != 0) {
                        setMove(true);
                        setSelect(pos[index]);
                      }
                    }
                  }}
                  className={`square ${isDark ? "dark" : ""}`}
                >
                  {pieceMap[square] ? <Piecer piece={pieceMap[square]} /> : ""}

                  {moves.map((item) => parseMove(item)).includes(pos[index]) ? (
                    <div className="valid"></div>
                  ) : (
                    ""
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="button-arrange">
          {/* <Button
            type="primary"
            onClick={() => {
              getMoves("a4");
            }}
          >
            Get Moves
          </Button>
          <Button
            type="primary"
            onClick={() => {
              handleUserMove("a2a3");
            }}
          >
            Move
          </Button>
          <Button type="primary" onClick={botMove}>
            Get Best Move
          </Button>
          <Button
            onClick={() => {
              console.log(parseCurrentPlayer(game.fen()));
            }}
          >
            Parser
          </Button> */}
          STATS
        </div>
      </div>
    </div>
  );
}

function Piecer({ piece }) {
  return (
    <img
      src={String(`./pieces/${piece}.png`)}
      alt="Piece"
      className="piece"
    ></img>
  );
}
