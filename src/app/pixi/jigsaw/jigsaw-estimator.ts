// Algorithm taken from Standup Maths video:
// Why don't Jigsaw Puzzles have the correct number of pieces?
// https://www.youtube.com/watch?v=vXWvptwoCl8

export class JigsawEstimator {
  private constructor() {
  }

  public static estimate(width: number, height: number, pieces: number, direction: "forwards" | "backwards") {
    const aspectRatio = Math.max(width, height) / Math.min(width, height);

    let optimalSides: [number, number] = [0, 0];
    let optimalPieceCount = 0;
    let optimalPieceRatio = 0;

    const directionRange = this.getDirectionRange(pieces, direction);

    for (const pieceCount of directionRange) {
      let currentBestRatio = 0;
      let currentBestSides: [number, number] = [0, 0];

      for (const rowFactor of this.lowFactors(pieceCount)) {
        const columnFactor = Math.floor(pieceCount / rowFactor);
        const currentRatio = columnFactor / rowFactor;

        if (currentBestRatio === 0 || Math.abs(currentRatio / aspectRatio - 1) < Math.abs(currentBestRatio / aspectRatio - 1)) {
          currentBestRatio = currentRatio;
          currentBestSides = [rowFactor, columnFactor];
        }
      }

      if (optimalPieceCount === 0 || Math.abs(currentBestRatio / aspectRatio - 1) < Math.abs(optimalPieceRatio / aspectRatio - 1)) {
        optimalPieceCount = pieceCount;
        optimalPieceRatio = currentBestRatio;
        optimalSides = currentBestSides;
      }
    }

    return {
      rows: optimalSides[0],
      columns: optimalSides[1],
      pieceWidth: width / optimalSides[1],
      pieceHeight: height / optimalSides[0]
    }
  }

  private static getDirectionRange(pieces: number, direction: "forwards" | "backwards") {
    switch (direction) {
      case "forwards": {
        return Array.from({length: Math.floor((1 + 0.1) * pieces) - pieces + 1}, (_, i) => pieces + i);
      }
      case "backwards": {
        return Array.from({length: pieces - Math.floor((1 - 0.1) * pieces) + 1}, (_, i) => pieces - 1 - i).reverse()
      }
    }
  }

  private static lowFactors(n: number): number[] {
    const lowFactors: number[] = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        lowFactors.push(i);
      }
    }
    return lowFactors;
  }
}
