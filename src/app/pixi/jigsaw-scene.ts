import {IScene, SceneManager} from "./scene-manager";
import * as PIXI from "pixi.js";
import {InfinityCanvas} from "./infinity-canvas";
import {JigsawGenerator} from "./jigsaw-generator";
import {PixiUtils} from "./utils";
import {PeerManagerService} from "../services/peer-manager/peer-manager.service";
import {MessageEncoder} from "../network/message-encoder";
import {MessageDecoder} from "../network/message-decoder";
import {MessageType} from "../network/common";
import {CursorMessage} from "../network/protocol/cursor-message";
import {JigsawPiece} from "./jigsaw-piece";

export class JigsawScene extends PIXI.Container implements IScene {
  private worldContainer: InfinityCanvas;
  private world: PIXI.Graphics;
  private prevWorldPointer: PIXI.Point;
  private taggedPieces: JigsawPiece[];
  private tileWidth: number;
  private dragTarget: JigsawPiece | null;

  constructor(private peerManager: PeerManagerService) {
    super();
    this.prevWorldPointer = new PIXI.Point();
    this.dragTarget = null;

    // setup the infinity canvas
    const worldSize = 5000;
    this.worldContainer = new InfinityCanvas(SceneManager.appRenderer.events, worldSize, worldSize);
    this.world = new PIXI.Graphics().rect(0, 0, worldSize, worldSize).fill({color: 0x424769});
    this.worldContainer.addChild(this.world);

    // initialized in the scene manager so shouldn't need to load
    const image: PIXI.Texture = PIXI.Assets.get("image");
    // generate the jigsaw

    this.tileWidth = 100;
    const generator = new JigsawGenerator(image, this.tileWidth);
    this.taggedPieces = generator.generatePieces(5, 0x000000, SceneManager.appRenderer);

    // setup dragging and dropping jigsaw pieces
    this.setupEvents();

    generator.placePieces(this.worldContainer, this.taggedPieces);

    this.setupP2P();

    this.addChild(this.worldContainer);
  }

  private setupP2P() {
    const cursor = new PIXI.GraphicsContext()
      .circle(0, 0, 8)
      .fill({color: 0xffffff})
      .stroke({color: 0x111111, alpha: 0.87, width: 1})

    this.peerManager.onDataChannelOpen = (channel) => {
      const peerCursor = this.worldContainer.addChild(
        new PIXI.Graphics(cursor)
      );

      channel.onclose = () => {
        this.worldContainer.removeChild(peerCursor);
      }

      channel.onmessage = (event => {
        if (typeof event.data === "string") {
          console.log("got string?: ", event.data);
        } else if (event.data instanceof ArrayBuffer) {
          if (event.data.byteLength < 1) {
            return;
          }
          const decoder = new MessageDecoder(event.data);
          const type = decoder.decodeUint8();
          switch (type) {
            case MessageType.Cursor: {
              const cursor = new CursorMessage();
              cursor.decode(decoder);
              peerCursor.position.set(cursor.x, cursor.y);
              if (cursor.piece) {
                this.taggedPieces[cursor.piece].position.set(cursor.x, cursor.y);
              }
              peerCursor.scale.x = 1 / this.worldContainer.scale.x;
              peerCursor.scale.y = 1 / this.worldContainer.scale.y;
              break;
            }
            default: {
              console.log("Received unknown message type");
            }
          }
        } else {
          console.log("Received unknown data type, can't parse");
        }
      })
    };
  }

  private setupEvents() {
    // reference to the class itself, because "this" is also used in event functions to reference jigsaw pieces
    const sceneThis = this;

    this.worldContainer.eventMode = "static";
    this.worldContainer.hitArea = this.world.boundsArea;

    function onDragStart(this: JigsawPiece, event: PIXI.FederatedPointerEvent) {
      sceneThis.worldContainer.pause();
      let target: PIXI.Sprite | PIXI.Container = this;
      if (this.parent != sceneThis.worldContainer) {
        target = this.parent;
      }

      target.alpha = 0.5;
      const pointerCoords = target.toLocal(event.global);
      target.pivot.copyFrom(pointerCoords);
      target.position.copyFrom(sceneThis.world.toLocal(event.global));
      sceneThis.dragTarget = this;

      sceneThis.worldContainer.on('pointermove', onDragMove);
    }

    function onDragMove(event: PIXI.FederatedPointerEvent) {
      if (sceneThis.dragTarget) {
        let point = sceneThis.world.toLocal(event.global);
        if (sceneThis.world.containsPoint(point)) {
          if (sceneThis.dragTarget.parent != sceneThis.worldContainer) {
            sceneThis.dragTarget.parent?.position.copyFrom(point);
          } else {
            sceneThis.dragTarget.position.copyFrom(point);
          }
        }
      }
    }

    function onDragEnd() {
      if (sceneThis.dragTarget) {
        sceneThis.worldContainer.off('pointermove', onDragMove);

        if (sceneThis.dragTarget.parent != sceneThis.worldContainer) {
          sceneThis.dragTarget.parent.alpha = 1;
          sceneThis.handleContainerSnap(sceneThis.dragTarget.parent);
        } else {
          sceneThis.dragTarget.alpha = 1;
          sceneThis.handlePieceSnap(sceneThis.dragTarget);
        }

        sceneThis.dragTarget = null;
      }
      sceneThis.worldContainer.resume();
    }

    this.worldContainer.on('pointerupoutside', onDragEnd);
    this.worldContainer.on('pointerup', onDragEnd);

    this.taggedPieces.forEach(piece => {
      piece.eventMode = "static";
      piece.cursor = "pointer";
      piece.on('pointerdown', onDragStart, piece);
    });
  }

  private handleContainerSnap(container: PIXI.Container) {
    for (let child of container.children) {
      // only one needs to be aligned properly
      if (child instanceof JigsawPiece) {
        if (this.handlePieceSnap(child)) {
          break;
        }
      }
    }
  }

  private handlePieceSnap(piece: JigsawPiece): boolean {
    for (let i = 0; i < piece.neighbours.length; i++) {
      const id = piece.neighbours[i].id;
      const direction = piece.neighbours[i].direction;
      const neighbour = this.taggedPieces[id];

      const pieceInContainer = piece.parent != this.worldContainer;
      const neighbourInContainer = neighbour.parent != this.worldContainer

      if (pieceInContainer && neighbourInContainer && piece.parent === neighbour.parent) {
        continue;
      }

      const wiggleRoom = this.tileWidth / 4;
      const distance = PixiUtils.getDistanceToNeighbourTab(this.world, piece!, neighbour, wiggleRoom, direction);
      if (distance <= this.tileWidth / 2) {
        let target: PIXI.Sprite | PIXI.Container = piece;

        if (pieceInContainer) {
          const pos = piece.parent?.toLocal(piece.alignmentPivot, piece);
          piece.parent?.pivot.copyFrom(pos);
          piece.parent.position.copyFrom(pos);
          target = piece.parent;
        } else {
          piece.resetPivot();
        }

        const neighbourPivot = this.world.toLocal(neighbour.alignmentPivot, neighbour);

        switch (direction) {
          case "top": {
            target.position.set(neighbourPivot.x, neighbourPivot.y + this.tileWidth);
            break;
          }
          case "bottom": {
            target.position.set(neighbourPivot.x, neighbourPivot.y - this.tileWidth);
            break;
          }
          case "left": {
            target.position.set(neighbourPivot.x + this.tileWidth, neighbourPivot.y);
            break;
          }
          case "right": {
            target.position.set(neighbourPivot.x - this.tileWidth, neighbourPivot.y);
            break;
          }
        }

        if (!pieceInContainer && !neighbourInContainer) {
          const container = new PIXI.Container({isRenderGroup: true});
          container.addChild(neighbour, piece);
          this.worldContainer.removeChild(neighbour, piece);
          this.worldContainer.addChild(container);
        } else if (!pieceInContainer && neighbourInContainer) {
          const piecePos = neighbour.parent?.toLocal(piece.position, this.world);
          neighbour.parent.addChild(piece);
          this.worldContainer.removeChild(piece);
          piece.position.copyFrom(piecePos);
        } else if (pieceInContainer && !neighbourInContainer) {
          const neighbourPos = piece.parent?.toLocal(neighbour.position, this.world);
          piece.parent?.addChild(neighbour);
          this.worldContainer.removeChild(neighbour);
          neighbour.position.copyFrom(neighbourPos);
        } else {
          const container = piece.parent;
          const children = [...container?.children];
          for (let child of children) {
            let piecePos = neighbour.parent?.toLocal(this.world.toLocal(child, child.parent), this.world);
            neighbour.parent.addChild(child);
            child.position.copyFrom(piecePos);
          }
          container?.removeFromParent();
        }
        return true;
      }
    }
    return false;
  }

  public update(ticker: PIXI.Ticker) {
    const currentMousePos = SceneManager.appRenderer.events.pointer.global;
    const worldPointer = new PIXI.Point(
      (currentMousePos.x - this.worldContainer.x) / this.worldContainer.scale.x,
      (currentMousePos.y - this.worldContainer.y) / this.worldContainer.scale.y
    );

    if ((this.prevWorldPointer.x != worldPointer.x || this.prevWorldPointer.y != worldPointer.y) && this.world.containsPoint(worldPointer)) {
      const message = new MessageEncoder();
      const cursor = new CursorMessage(worldPointer.x, worldPointer.y, this.dragTarget?.id);
      cursor.encode(message);
      this.peerManager.broadcastMessage(message.getBuffer());
    }

    this.prevWorldPointer = worldPointer;
  }

  public resize(width: number, height: number) {

  }

}
