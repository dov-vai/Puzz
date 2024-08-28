import * as PIXI from 'pixi.js';

export interface JigsawNeighbour {
  id: number;
  direction: "top" | "bottom" | "left" | "right";
}

export class JigsawPiece extends PIXI.Sprite {
  private _id: number;
  private _alignmentPivot: PIXI.Point;
  private _neighbours: JigsawNeighbour[]

  get id(): number {
    return this._id;
  }

  get alignmentPivot() {
    return this._alignmentPivot;
  }

  get neighbours() {
    return this._neighbours;
  }

  constructor(
    id: number,
    alignmentPivot: PIXI.Point,
    neighbours: JigsawNeighbour[],
    options?: PIXI.SpriteOptions | PIXI.Texture
  ) {
    super(options);
    this._id = id;
    this._alignmentPivot = alignmentPivot;
    this._neighbours = neighbours;
  }

  resetPivot() {
    this.pivot.copyFrom(this._alignmentPivot);
    this.position.copyFrom(this._alignmentPivot);
  }

  addAlignmentPivot(point: PIXI.Point) {
    return new PIXI.Point(point.x + this.alignmentPivot.x, point.y + this.alignmentPivot.y);
  }


}
