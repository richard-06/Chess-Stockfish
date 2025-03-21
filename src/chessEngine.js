import React, { useEffect, useRef, useState } from "react";
import { createStockfishWorker } from "./utils/stockfishWorker";

const ChessEngine = ({ fen, bestMove, setBestMove }) => {
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

  return (
    <div>
      <h2>Stockfish Chess Engine</h2>
      <p>
        <strong>FEN:</strong> {fen}
      </p>
      <button onClick={getBestMove}>Get Best Move</button>
      {bestMove && (
        <p>
          <strong>Best Move:</strong> {bestMove}
        </p>
      )}
    </div>
  );
};

export default ChessEngine;
