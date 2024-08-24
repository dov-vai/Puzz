import {MessageDecoder} from "../../network/message-decoder";
import * as PIXI from "pixi.js";
import {CursorMessage} from "../../network/protocol/cursor-message";
import {JigsawPiece} from "./jigsaw-piece";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {PeerCursor} from "./peer-cursor";
import {Peer} from "../../services/peer-manager/peer";
import {MessageType} from "../../network/common";

export class PeerCursorManager {
  private cursors: PeerCursor[];

  constructor(private manager: JigsawPieceManager) {
    this.cursors = [];
  }

  public addCursor(peer: Peer) {
    const cursor = new PeerCursor();
    this.cursors.push(cursor);
    this.manager.worldContainer.addChild(cursor);

    peer.registerMessageHandler((message) => {
      const decoder = new MessageDecoder(message);
      const type = decoder.decodeUint8();
      if (type === MessageType.Cursor) {
        this.handleCursorMessage(decoder, cursor);
      }
    })

    peer.registerCloseHandler(() => {
      this.manager.worldContainer.removeChild(cursor);
    })
  }

  private handleCursorMessage(decoder: MessageDecoder, peerCursor: PeerCursor) {
    const cursor = new CursorMessage();
    cursor.decode(decoder);
    const cursorPosition = new PIXI.Point(cursor.x, cursor.y);
    peerCursor.position.copyFrom(cursorPosition);
    if (cursor.piece != undefined) {
      let target: JigsawPiece | PIXI.Container = this.manager.taggedPieces[cursor.piece];
      if (target.parent != this.manager.worldContainer) {
        target = target.parent;
      }
      const pivotCoords = target.toLocal(cursorPosition, this.manager.world);
      if (peerCursor.lastPickedPiece != cursor.piece) {
        // TODO: more foolproof pivot setting?
        target.zIndex = 1;
        target.pivot.copyFrom(pivotCoords);
      }
      target.position.copyFrom(cursorPosition);
      peerCursor.lastPickedPiece = cursor.piece;
    } else {
      if (peerCursor.lastPickedPiece != -1) {
        let target: JigsawPiece | PIXI.Container = this.manager.taggedPieces[peerCursor.lastPickedPiece];
        if (target.parent != this.manager.worldContainer) {
          target = target.parent;
        }
        target.zIndex = 0;
      }

      peerCursor.lastPickedPiece = -1;
    }
    peerCursor.scale.x = 1 / this.manager.worldContainer.scale.x;
    peerCursor.scale.y = 1 / this.manager.worldContainer.scale.y;
  }

}
