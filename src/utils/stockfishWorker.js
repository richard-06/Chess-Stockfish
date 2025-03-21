export function createStockfishWorker() {
    // Check if Stockfish is available
    if (typeof Worker === "undefined") {
      console.error("Web Workers are not supported in this environment.");
      return null;
    }
  
    // Create a new Stockfish worker (if using the npm package)
    const engine = new Worker('/stockfish.js');



  
    return engine;
  }