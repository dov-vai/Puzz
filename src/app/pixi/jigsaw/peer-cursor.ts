import * as PIXI from "pixi.js";
import {Peer} from "../../services/peer-manager/peer";
import {MessageDecoder} from "../../network/message-decoder";
import {CursorMessage} from "../../network/protocol/cursor-message";
import {JigsawPiece} from "./jigsaw-piece";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {MessageType} from "../../network/common";

export class PeerCursor extends PIXI.Graphics {
  private static cursorContext = new PIXI.GraphicsContext()
    .circle(0, 0, 8)
    .fill({color: 0xffffff})
    .stroke({color: 0x111111, alpha: 0.87, width: 1});

  private lastPickedPiece: number;

  constructor() {
    super(PeerCursor.cursorContext);
    this.lastPickedPiece = -1;
    this.zIndex = 2;
  }

  public handle(peer: Peer, manager: JigsawPieceManager) {
    peer.registerMessageHandler((message) => {
      const decoder = new MessageDecoder(message);
      const type = decoder.decodeUint8();
      if (type === MessageType.Cursor) {
        this.handleCursorMessage(decoder, manager);
      }
    })

    peer.registerCloseHandler(() => {
      manager.worldContainer.removeChild(this);
    })
  }

  private handleCursorMessage(decoder: MessageDecoder, manager: JigsawPieceManager) {
    const cursor = new CursorMessage();
    cursor.decode(decoder);
    const cursorPosition = new PIXI.Point(cursor.x, cursor.y);
    this.position.copyFrom(cursorPosition);
    if (cursor.piece != undefined) {
      let target: JigsawPiece | PIXI.Container = manager.taggedPieces[cursor.piece];
      if (target.parent != manager.worldContainer) {
        target = target.parent;
      }
      const pivotCoords = target.toLocal(cursorPosition, manager.world);
      if (this.lastPickedPiece != cursor.piece) {
        // TODO: more foolproof pivot setting?
        target.zIndex = 1;
        target.pivot.copyFrom(pivotCoords);
      }
      target.position.copyFrom(cursorPosition);
      this.lastPickedPiece = cursor.piece;
    } else {
      if (this.lastPickedPiece != -1) {
        let target: JigsawPiece | PIXI.Container = manager.taggedPieces[this.lastPickedPiece];
        if (target.parent != manager.worldContainer) {
          target = target.parent;
        }
        target.zIndex = 0;
      }

      this.lastPickedPiece = -1;
    }
    this.scale.x = 1 / manager.worldContainer.scale.x;
    this.scale.y = 1 / manager.worldContainer.scale.y;
  }
}
