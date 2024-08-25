import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {MessageDecoder} from "../../network/message-decoder";
import {SyncContainer, SyncMessage, SyncPiece} from "../../network/protocol/sync-message";
import * as PIXI from "pixi.js";
import {Peer} from "../../services/peer-manager/peer";
import {JigsawPiece} from "./jigsaw-piece";
import {MessageEncoder} from "../../network/message-encoder";
import {SnapMessage} from "../../network/protocol/snap-message";
import {MessageType} from "../../network/common";

export class SyncHandler {
  constructor(private manager: JigsawPieceManager) {
  }

  public handle(message: any, peer: Peer) {
    if (message instanceof ArrayBuffer) {
      const decoder = new MessageDecoder(message);
      const type = decoder.decodeUint8();
      switch (type) {
        case MessageType.Snap: {
          this.handleSnapMessage(decoder);
          break;
        }
        case MessageType.SyncRequest: {
          this.handleSyncRequestMessage(peer);
          break;
        }
        case MessageType.Sync: {
          this.handleSyncMessage(decoder);
        }
      }
    }
  }


  private handleSyncMessage(decoder: MessageDecoder) {
    const sync = new SyncMessage();
    sync.decode(decoder);

    for (let syncPiece of sync.pieces) {
      const piece = this.manager.taggedPieces[syncPiece.id];
      piece.pivot.set(syncPiece.pivotX, syncPiece.pivotY);
      piece.position.set(syncPiece.x, syncPiece.y);
    }

    for (let container of sync.containers) {
      // hash set for faster neighbour lookup
      const pieceSet = new Set(container.pieceIds);
      for (let containerPiece of container.pieceIds) {
        const piece = this.manager.taggedPieces[containerPiece];
        for (let neighbour of piece.neighbours) {
          if (pieceSet.has(neighbour.id)) {
            this.manager.handlePieceSnap(piece, neighbour);
          }
        }
      }
      // pick the first one just to get the parent container
      const piece = this.manager.taggedPieces[container.pieceIds[0]];
      const containerPivot = piece.parent?.toLocal(
        new PIXI.Point(container.pivotX, container.pivotY),
        this.manager.taggedPieces[container.pivotPiece]
      );
      piece.parent?.pivot.copyFrom(containerPivot);
      piece.parent.position.set(container.x, container.y);
    }
  }

  private handleSyncRequestMessage(peer: Peer) {
    const pieces: SyncPiece[] = [];
    const containers: SyncContainer[] = [];

    const checkedPieces: Set<number> = new Set();
    for (let piece of this.manager.taggedPieces) {
      if (checkedPieces.has(piece.id)) {
        continue;
      }

      if (piece.parent != this.manager.worldContainer) {
        const syncContainer: SyncContainer = {
          x: piece.parent.x,
          y: piece.parent.y,
          pivotPiece: -1,
          pivotX: -1,
          pivotY: -1,
          pieceIds: []
        }

        for (let containerPiece of piece.parent?.children) {
          if (containerPiece instanceof JigsawPiece) {
            if (syncContainer.pivotPiece == -1) {
              const pivotPoint = containerPiece.toLocal(piece.parent?.pivot, piece.parent);
              if (containerPiece.containsPoint(pivotPoint)) {
                syncContainer.pivotPiece = containerPiece.id;
                syncContainer.pivotX = pivotPoint.x;
                syncContainer.pivotY = pivotPoint.y;
              }
            }
            syncContainer.pieceIds.push(containerPiece.id);
            checkedPieces.add(containerPiece.id);
          }
        }
        containers.push(syncContainer);
      } else {
        const syncPiece: SyncPiece = {
          id: piece.id,
          x: piece.x,
          y: piece.y,
          pivotX: piece.pivot.x,
          pivotY: piece.pivot.y
        }
        checkedPieces.add(piece.id);
        pieces.push(syncPiece);
      }
    }
    const encoder = new MessageEncoder();
    const sync = new SyncMessage(pieces, containers);
    sync.encode(encoder);
    peer.sendMessage(encoder.getBuffer());
  }

  private handleSnapMessage(decoder: MessageDecoder) {
    const snap = new SnapMessage();
    snap.decode(decoder);
    this.manager.handlePieceSnap(
      this.manager.taggedPieces[snap.pieceId],
      this.manager.taggedPieces[snap.pieceId].neighbours[snap.neighbourId]
    )
  }
}
