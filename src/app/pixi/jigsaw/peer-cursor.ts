import * as PIXI from "pixi.js";

export class PeerCursor extends PIXI.Graphics {
  private static cursorContext = new PIXI.GraphicsContext()
    .circle(0, 0, 8)
    .fill({color: 0xffffff})
    .stroke({color: 0x111111, alpha: 0.87, width: 1});

  private _lastPickedPiece: number;

  get lastPickedPiece() {
    return this._lastPickedPiece;
  }

  set lastPickedPiece(lastPickedPiece: number) {
    this._lastPickedPiece = lastPickedPiece;
  }

  constructor() {
    super(PeerCursor.cursorContext);
    this._lastPickedPiece = -1;
    this.zIndex = 2;
  }
}
