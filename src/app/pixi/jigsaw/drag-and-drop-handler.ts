import {JigsawPiece} from "./jigsaw-piece";
import * as PIXI from "pixi.js";
import {PixiUtils} from "../utils";
import {JigsawPieceManager} from "./jigsaw-piece-manager";

export class DragAndDropHandler {
  private dragTarget: JigsawPiece | null;

  constructor(private manager: JigsawPieceManager) {
    this.dragTarget = null;
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
      sceneThis.dragTarget = this;

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
    if (this.dragTarget) {
      let point = this.manager.world.toLocal(event.global);
      if (this.manager.world.containsPoint(point)) {
        if (this.dragTarget.parent != this.manager.worldContainer) {
          this.dragTarget.parent?.position.copyFrom(point);
        } else {
          this.dragTarget.position.copyFrom(point);
        }
      }
    }
  }

  private onDragEnd() {
    if (this.dragTarget) {
      this.manager.worldContainer.off('pointermove', this.onDragMove);

      if (this.dragTarget.parent != this.manager.worldContainer) {
        this.dragTarget.parent.alpha = 1;
        this.dragTarget.parent.zIndex = 0;
        this.checkContainerSnap(this.dragTarget.parent);
      } else {
        this.dragTarget.alpha = 1;
        this.dragTarget.zIndex = 0;
        this.checkPieceSnap(this.dragTarget);
      }

      this.dragTarget = null;
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

      const wiggleRoom = this.manager.tileWidth / 4;
      const distance = PixiUtils.getDistanceToNeighbourTab(this.manager.world, piece!, neighbour, wiggleRoom, direction);
      if (distance <= this.manager.tileWidth / 2) {
        this.manager.handlePieceSnap(piece, piece.neighbours[i]);
        return true;
      }
    }
    return false;
  }
}
