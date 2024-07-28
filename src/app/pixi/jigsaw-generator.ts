import * as PIXI from 'pixi.js';

export interface Shape {
  topTab?: number;
  rightTab?: number;
  bottomTab?: number;
  leftTab?: number;
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
    const tileCenter = new PIXI.Point(tileWidth / 2, tileWidth / 2);

    const topLeftEdge = new PIXI.Point(-4, 4);

    mask.moveTo(topLeftEdge.x, topLeftEdge.y);

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


  private getRandomTabValue(): number {
    return Math.random() > 0.5 ? 1 : -1;
  }

  getRandomShapes(width: number, height: number): Shape[] {
    const shapeArray: Shape[] = new Array(width * height);

    // Initialize shapes with undefined tab values and edge constraints
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const topTab = y === 0 ? 0 : undefined;
        const rightTab = x === width - 1 ? 0 : undefined;
        const bottomTab = y === height - 1 ? 0 : undefined;
        const leftTab = x === 0 ? 0 : undefined;

        shapeArray[y * width + x] = {
          topTab: topTab,
          rightTab: rightTab,
          bottomTab: bottomTab,
          leftTab: leftTab
        };
      }
    }

    // Set random tab values and ensure neighboring shapes have matching tabs
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const shape = shapeArray[y * width + x];

        const shapeRight = x < width - 1 ? shapeArray[y * width + (x + 1)] : undefined;
        const shapeBottom = y < height - 1 ? shapeArray[(y + 1) * width + x] : undefined;

        if (x < width - 1) {
          shape.rightTab = this.getRandomTabValue();
          if (shapeRight) {
            shapeRight.leftTab = -shape.rightTab;
          }
        }

        if (y < height - 1) {
          shape.bottomTab = this.getRandomTabValue();
          if (shapeBottom) {
            shapeBottom.topTab = -shape.bottomTab;
          }
        }
      }
    }

    return shapeArray;
  }

  generatePieces(borderWidth: number, borderColor: number) {
    const rows = Math.ceil(this.texture.width / this.tileWidth);
    const columns = Math.ceil(this.texture.height / this.tileWidth);

    const pieces: PIXI.Graphics[] = new Array(rows * columns);
    const shapes = this.getRandomShapes(rows, columns);

    // scales the bezier curve
    const tileRatio = this.tileWidth / 100.0;

    for (let y = 0; y < columns; y++) {
      for (let x = 0; x < rows; x++) {
        const shape = shapes[y * rows + x];

        const pieceTexture = new PIXI.Texture({
          source: this.texture.source,
          frame: new PIXI.Rectangle(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth)
        });

        pieces[y * rows + x] = this.getMask(tileRatio, shape, this.tileWidth)
          .stroke({width: borderWidth, color: borderColor})
          .fill({texture: pieceTexture});
      }
    }

    return pieces;
  }
}
