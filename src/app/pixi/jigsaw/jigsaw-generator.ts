import * as PIXI from 'pixi.js';
import {JigsawNeighbour, JigsawPiece} from "./jigsaw-piece";

export interface Shape {
  topTab?: number;
  rightTab?: number;
  bottomTab?: number;
  leftTab?: number;
}

export class JigsawGenerator {
  private texture: PIXI.Texture;
  private tileWidth: number;
  private random: () => number;

  constructor(texture: PIXI.Texture, tileWidth: number, seed: number) {
    this.texture = texture;
    this.tileWidth = tileWidth;
    this.random = this.splitMix32(seed);
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

  private getRandomTabValue(): number {
    return this.random() > 0.5 ? 1 : -1;
  }

  getRandomShapes(columns: number, rows: number): Shape[] {
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
          shape.rightTab = this.getRandomTabValue();
          if (shapeRight) {
            shapeRight.leftTab = -shape.rightTab;
          }
        }

        if (y < rows - 1) {
          shape.bottomTab = this.getRandomTabValue();
          if (shapeBottom) {
            shapeBottom.topTab = -shape.bottomTab;
          }
        }
      }
    }

    return shapeArray;
  }

  generatePieces(borderWidth: number, borderColor: number, renderer: PIXI.Renderer) {
    const columns = Math.ceil(this.texture.width / this.tileWidth);
    const rows = Math.ceil(this.texture.height / this.tileWidth);

    const pieces: JigsawPiece[] = new Array(columns * rows);
    const shapes = this.getRandomShapes(columns, rows);

    // scales the bezier curve
    const tileRatio = this.tileWidth / 100.0;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const id = y * columns + x;

        const shape = shapes[id];
        const pieceTexture = new PIXI.Texture({
          source: this.texture.source,
          frame: new PIXI.Rectangle(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth)
        });

        const maskedPiece = this.getMask(tileRatio, shape, this.tileWidth)
          .stroke({width: borderWidth, color: borderColor})
          .fill({texture: pieceTexture});

        const renderedTexture = renderer.generateTexture({target: maskedPiece, antialias: true})
        const alignmentPivot = new PIXI.Point(-maskedPiece.bounds.minX, -maskedPiece.bounds.minY);
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
        pieces[id] = new JigsawPiece(id, alignmentPivot, neighbours, renderedTexture);
      }
    }

    return pieces;
  }
}
