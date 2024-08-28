import {JigsawPiece} from "./jigsaw-piece";
import * as PIXI from "pixi.js";
import {PixiUtils} from "../utils";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {PlayerManager} from "./player-manager";
import {SnapMessage} from "../../network/protocol/snap-message";
import {MessageEncoder} from "../../network/message-encoder";
import {SNAP_SOUND} from "./jigsaw-scene";
import {sound} from "@pixi/sound";

export class DragAndDropHandler {
  private _dragTarget: JigsawPiece | null;

  get dragTarget() {
    return this._dragTarget;
  }

  constructor(private manager: JigsawPieceManager, private playerManager: PlayerManager) {
    this._dragTarget = null;
  }

  public setupEvents() {
    // reference to the class itself, because "this" is also used in event functions to reference jigsaw pieces
    const sceneThis = this;

    function onDragStart(this: JigsawPiece, event: PIXI.FederatedPointerEvent) {
      // check for right mouse click and ignore it (for panning)
      if (event.nativeEvent instanceof MouseEvent && event.nativeEvent.button === 2) {
        return;
      }
      let target: PIXI.Sprite | PIXI.Container = this;
      if (this.parent != sceneThis.manager.worldContainer) {
        target = this.parent;
      }
      target.zIndex = 1;
      target.alpha = 0.5;
      const pointerCoords = target.toLocal(event.global);
      target.pivot.copyFrom(pointerCoords);
      target.position.copyFrom(sceneThis.manager.world.toLocal(event.global));
      sceneThis._dragTarget = this;

      sceneThis.manager.worldContainer.on('pointermove', sceneThis.onDragMove.bind(sceneThis));
    }

    this.manager.worldContainer.eventMode = "static";
    this.manager.worldContainer.hitArea = this.manager.world.boundsArea;

    this.manager.worldContainer.on('pointerupoutside', this.onDragEnd.bind(this));
    this.manager.worldContainer.on('pointerup', this.onDragEnd.bind(this));

    this.manager.taggedPieces.forEach(piece => {
      piece.eventMode = "static";
      piece.cursor = "pointer";
      piece.on('pointerdown', onDragStart, piece);
    });
  }

  private onDragMove(event: PIXI.FederatedPointerEvent) {
    if (this._dragTarget) {
      let point = this.manager.world.toLocal(event.global);
      if (this.manager.world.containsPoint(point)) {
        if (this._dragTarget.parent != this.manager.worldContainer) {
          this._dragTarget.parent?.position.copyFrom(point);
        } else {
          this._dragTarget.position.copyFrom(point);
        }
      }
    }
  }

  private onDragEnd() {
    if (this._dragTarget) {
      this.manager.worldContainer.off('pointermove', this.onDragMove);

      if (this._dragTarget.parent != this.manager.worldContainer) {
        this._dragTarget.parent.alpha = 1;
        this._dragTarget.parent.zIndex = 0;
        this.checkContainerSnap(this._dragTarget.parent);
      } else {
        this._dragTarget.alpha = 1;
        this._dragTarget.zIndex = 0;
        this.checkPieceSnap(this._dragTarget);
      }

      this._dragTarget = null;
    }
  }

  private checkContainerSnap(container: PIXI.Container) {
    for (let child of container.children) {
      // only one needs to be aligned properly
      if (child instanceof JigsawPiece) {
        if (this.checkPieceSnap(child)) {
          break;
        }
      }
    }
  }

  private piecesInSameContainer(piece: JigsawPiece, neighbour: JigsawPiece) {
    return piece.parent != this.manager.worldContainer && piece.parent === neighbour.parent;
  }

  private checkPieceSnap(piece: JigsawPiece): boolean {
    for (let i = 0; i < piece.neighbours.length; i++) {
      const id = piece.neighbours[i].id;
      const direction = piece.neighbours[i].direction;
      const neighbour = this.manager.taggedPieces[id];

      if (this.piecesInSameContainer(piece, neighbour)) {
        continue;
      }

      const {pieceSnapPoint, neighbourSnapPoint} = this.getSnapPoints(piece, neighbour, direction);
      const distance = PixiUtils.getDistance(pieceSnapPoint, neighbourSnapPoint);
      if (distance <= this.manager.tileWidth / 16) {
        this.manager.handlePieceSnap(piece, piece.neighbours[i]);
        sound.play(SNAP_SOUND);
        // FIXME: an extra dependancy just for this, maybe there's a better way?
        const encoder = new MessageEncoder();
        // FIXME: neighbour piece id instead of the array index
        const snap = new SnapMessage(piece.id, i);
        snap.encode(encoder)
        this.playerManager.broadcast(encoder.getBuffer());
        return true;
      }
    }
    return false;
  }

  private getSnapPoints(piece: JigsawPiece, neighbour: JigsawPiece, direction: "top" | "bottom" | "left" | "right") {
    const midpoint = new PIXI.Point(this.manager.tileWidth / 2, this.manager.tileHeight / 2);
    const positions = {
      top: [new PIXI.Point(midpoint.x, 0), new PIXI.Point(midpoint.x, this.manager.tileHeight)],
      bottom: [new PIXI.Point(midpoint.x, this.manager.tileHeight), new PIXI.Point(midpoint.x, 0)],
      left: [new PIXI.Point(0, midpoint.y), new PIXI.Point(this.manager.tileWidth, midpoint.y)],
      right: [new PIXI.Point(this.manager.tileWidth, midpoint.y), new PIXI.Point(0, midpoint.y)]
    };

    const [piecePos, neighbourPos] = positions[direction];
    const pieceSnapPoint = this.manager.world.toLocal(piece.addAlignmentPivot(piecePos), piece);
    const neighbourSnapPoint = this.manager.world.toLocal(neighbour.addAlignmentPivot(neighbourPos), neighbour);

    return {pieceSnapPoint, neighbourSnapPoint};
  }
}
