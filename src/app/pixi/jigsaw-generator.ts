import * as PIXI from 'pixi.js';

export interface Shape {
  topTab?: number;
  rightTab?: number;
  bottomTab?: number;
  leftTab?: number;
}

export interface JigsawPiece {
  id: number;
  sprite: PIXI.Sprite,
  originalPivot: PIXI.Point,
  neighbours: JigsawNeighbour[]
}

export interface JigsawNeighbour {
  id: number;
  direction: "top" | "bottom" | "left" | "right";
}

export class JigsawGenerator {
  private texture: PIXI.Texture;
  private tileWidth: number;

  constructor(texture: PIXI.Texture, tileWidth: number) {
    this.texture = texture;
    this.tileWidth = tileWidth;
  }

  public getMask(
    tileRatio: number,
    shape: Shape,
    tileWidth: number
  ): PIXI.Graphics {

    const curvePoints: number[] = [
      0, 0, 35, 15, 37, 5,
      37, 5, 40, 0, 38, -5,
      38, -5, 20, -20, 50, -20,
      80, -20, 62, -5, 62, -5,
      60, 0, 63, 5, 63, 5,
      65, 15, 100, 0, 100, 0
    ];

    const mask = new PIXI.Graphics();
    const topLeftEdge = new PIXI.Point(0, 0);

    // Top
    for (let i = 0; i < curvePoints.length / 6; i++) {
      const p1 = new PIXI.Point(
        topLeftEdge.x + curvePoints[i * 6 + 0] * tileRatio,
        topLeftEdge.y + shape.topTab! * curvePoints[i * 6 + 1] * tileRatio
      );
      const p2 = new PIXI.Point(
        topLeftEdge.x + curvePoints[i * 6 + 2] * tileRatio,
        topLeftEdge.y + shape.topTab! * curvePoints[i * 6 + 3] * tileRatio
      );
      const p3 = new PIXI.Point(
        topLeftEdge.x + curvePoints[i * 6 + 4] * tileRatio,
        topLeftEdge.y + shape.topTab! * curvePoints[i * 6 + 5] * tileRatio
      );

      mask.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }

    // Right
    const topRightEdge = new PIXI.Point(topLeftEdge.x + tileWidth, topLeftEdge.y);
    for (let i = 0; i < curvePoints.length / 6; i++) {
      const p1 = new PIXI.Point(
        topRightEdge.x - shape.rightTab! * curvePoints[i * 6 + 1] * tileRatio,
        topRightEdge.y + curvePoints[i * 6 + 0] * tileRatio
      );
      const p2 = new PIXI.Point(
        topRightEdge.x - shape.rightTab! * curvePoints[i * 6 + 3] * tileRatio,
        topRightEdge.y + curvePoints[i * 6 + 2] * tileRatio
      );
      const p3 = new PIXI.Point(
        topRightEdge.x - shape.rightTab! * curvePoints[i * 6 + 5] * tileRatio,
        topRightEdge.y + curvePoints[i * 6 + 4] * tileRatio
      );

      mask.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }

    // Bottom
    const bottomRightEdge = new PIXI.Point(topRightEdge.x, topRightEdge.y + tileWidth);
    for (let i = 0; i < curvePoints.length / 6; i++) {
      const p1 = new PIXI.Point(
        bottomRightEdge.x - curvePoints[i * 6 + 0] * tileRatio,
        bottomRightEdge.y - shape.bottomTab! * curvePoints[i * 6 + 1] * tileRatio
      );
      const p2 = new PIXI.Point(
        bottomRightEdge.x - curvePoints[i * 6 + 2] * tileRatio,
        bottomRightEdge.y - shape.bottomTab! * curvePoints[i * 6 + 3] * tileRatio
      );
      const p3 = new PIXI.Point(
        bottomRightEdge.x - curvePoints[i * 6 + 4] * tileRatio,
        bottomRightEdge.y - shape.bottomTab! * curvePoints[i * 6 + 5] * tileRatio
      );

      mask.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }

    // Left
    const bottomLeftEdge = new PIXI.Point(bottomRightEdge.x - tileWidth, bottomRightEdge.y);
    for (let i = 0; i < curvePoints.length / 6; i++) {
      const p1 = new PIXI.Point(
        bottomLeftEdge.x + shape.leftTab! * curvePoints[i * 6 + 1] * tileRatio,
        bottomLeftEdge.y - curvePoints[i * 6 + 0] * tileRatio
      );
      const p2 = new PIXI.Point(
        bottomLeftEdge.x + shape.leftTab! * curvePoints[i * 6 + 3] * tileRatio,
        bottomLeftEdge.y - curvePoints[i * 6 + 2] * tileRatio
      );
      const p3 = new PIXI.Point(
        bottomLeftEdge.x + shape.leftTab! * curvePoints[i * 6 + 5] * tileRatio,
        bottomLeftEdge.y - curvePoints[i * 6 + 4] * tileRatio
      );

      mask.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }

    mask.closePath();

    return mask;
  }

  // pseudo-random number generator
  // https://stackoverflow.com/a/47593316
  private splitMix32(a: number) {
    return () => {
      a |= 0;
      a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
  }

  private getRandomTabValue(random: () => number): number {
    return random() > 0.5 ? 1 : -1;
  }

  getRandomShapes(columns: number, rows: number): Shape[] {
    // TODO: seed generation
    const random = this.splitMix32(1970827786);

    const shapeArray: Shape[] = new Array(columns * rows);

    // Initialize shapes with undefined tab values and edge constraints
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const topTab = y === 0 ? 0 : undefined;
        const rightTab = x === columns - 1 ? 0 : undefined;
        const bottomTab = y === rows - 1 ? 0 : undefined;
        const leftTab = x === 0 ? 0 : undefined;

        shapeArray[y * columns + x] = {
          topTab: topTab,
          rightTab: rightTab,
          bottomTab: bottomTab,
          leftTab: leftTab
        };
      }
    }

    // Set random tab values and ensure neighboring shapes have matching tabs
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const shape = shapeArray[y * columns + x];

        const shapeRight = x < columns - 1 ? shapeArray[y * columns + (x + 1)] : undefined;
        const shapeBottom = y < rows - 1 ? shapeArray[(y + 1) * columns + x] : undefined;

        if (x < columns - 1) {
          shape.rightTab = this.getRandomTabValue(random);
          if (shapeRight) {
            shapeRight.leftTab = -shape.rightTab;
          }
        }

        if (y < rows - 1) {
          shape.bottomTab = this.getRandomTabValue(random);
          if (shapeBottom) {
            shapeBottom.topTab = -shape.bottomTab;
          }
        }
      }
    }

    return shapeArray;
  }

  generatePieces(borderWidth: number, borderColor: number) {
    const columns = Math.ceil(this.texture.width / this.tileWidth);
    const rows = Math.ceil(this.texture.height / this.tileWidth);

    const pieces: PIXI.Graphics[] = new Array(columns * rows);
    const shapes = this.getRandomShapes(columns, rows);

    // scales the bezier curve
    const tileRatio = this.tileWidth / 100.0;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const shape = shapes[y * columns + x];

        const pieceTexture = new PIXI.Texture({
          source: this.texture.source,
          frame: new PIXI.Rectangle(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth)
        });

        pieces[y * columns + x] = this.getMask(tileRatio, shape, this.tileWidth)
          .stroke({width: borderWidth, color: borderColor})
          .fill({texture: pieceTexture});
      }
    }

    return pieces;
  }

  renderPieces(pieces: PIXI.Graphics[], renderer: PIXI.Renderer) {
    const columns = Math.ceil(this.texture.width / this.tileWidth);
    const rows = Math.ceil(this.texture.height / this.tileWidth);

    const sprites: PIXI.Sprite[] = new Array(columns * rows)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const piece = pieces[y * columns + x];
        const sprite = PIXI.Sprite.from(renderer.generateTexture({target: piece, antialias: true}));
        // set original pivot point
        sprite.pivot.set(-piece.bounds.minX, -piece.bounds.minY);
        sprites[y * columns + x] = sprite;
      }
    }

    return sprites;
  }

  placePieces(container: PIXI.Container, pieces: PIXI.Graphics[] | PIXI.Sprite[]) {
    const columns = Math.ceil(this.texture.width / this.tileWidth);
    const rows = Math.ceil(this.texture.height / this.tileWidth);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const piece = pieces[y * columns + x];
        piece.position.set(x * this.tileWidth, y * this.tileWidth);
        container.addChild(piece);
      }
    }
  }

  tagPieces(pieces: PIXI.Sprite[]) {
    const columns = Math.ceil(this.texture.width / this.tileWidth);
    const rows = Math.ceil(this.texture.height / this.tileWidth);
    const taggedPieces: JigsawPiece[] = new Array(columns * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const id = y * columns + x;
        const piece = pieces[id];

        const neighbours: JigsawNeighbour[] = [];

        if (x != 0) {
          neighbours.push({id: id - 1, direction: "left"});
        }
        if (x != columns - 1) {
          neighbours.push({id: id + 1, direction: "right"});
        }
        if (y != 0) {
          neighbours.push({id: id - columns, direction: "top"});
        }
        if (y != rows - 1) {
          neighbours.push({id: id + columns, direction: "bottom"});
        }

        const originalPivot = new PIXI.Point(piece.pivot.x, piece.pivot.y);
        taggedPieces[id] = {id: id, sprite: piece, originalPivot: originalPivot, neighbours: neighbours};

      }
    }
    return taggedPieces;
  }
}
