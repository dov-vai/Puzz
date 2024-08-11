import {IScene, SceneManager} from "./scene-manager";
import * as PIXI from "pixi.js";
import {InfinityCanvas} from "./infinity-canvas";
import {JigsawGenerator, JigsawPiece} from "./jigsaw-generator";
import {PixiUtils} from "./utils";
import {PeerManagerService} from "../services/peer-manager/peer-manager.service";
import {MessageEncoder} from "../network/message-encoder";
import {MessageDecoder} from "../network/message-decoder";
import {MessageType} from "../network/common";
import {CursorMessage} from "../network/protocol/cursor-message";

export class JigsawScene extends PIXI.Container implements IScene {
  private worldContainer: InfinityCanvas;
  private world: PIXI.Graphics;
  private prevWorldPointer: PIXI.Point;
  private taggedPieces: JigsawPiece[];
  private tileWidth: number;

  constructor(private peerManager: PeerManagerService) {
    super();
    this.prevWorldPointer = new PIXI.Point();

    // setup the infinity canvas
    const worldSize = 5000;
    this.worldContainer = new InfinityCanvas(SceneManager.appRenderer.events, worldSize, worldSize);
    this.world = new PIXI.Graphics().rect(0, 0, worldSize, worldSize).fill({color: 0x424769});
    this.worldContainer.addChild(this.world);

    // initialized in the scene manager so shouldn't need to load
    const image: PIXI.Texture = PIXI.Assets.get("cat");
    // generate the jigsaw

    this.tileWidth = 100;
    const generator = new JigsawGenerator(image, this.tileWidth);
    const pieces = generator.generatePieces(5, 0x000000);
    const renderedPieces = generator.renderPieces(pieces, SceneManager.appRenderer);
    this.taggedPieces = generator.tagPieces(renderedPieces);

    // setup dragging and dropping jigsaw pieces
    this.setupEvents();

    generator.placePieces(this.worldContainer, renderedPieces);

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

    let dragTarget: JigsawPiece | null = null;

    function onDragStart(this: JigsawPiece, event: PIXI.FederatedPointerEvent) {
      sceneThis.worldContainer.pause();
      this.sprite.alpha = 0.5;
      const pointerCoords = this.sprite.toLocal(event.global);
      this.sprite.pivot.copyFrom(pointerCoords);
      dragTarget = this;
      sceneThis.worldContainer.on('pointermove', onDragMove);
    }

    function onDragMove(event: PIXI.FederatedPointerEvent) {
      if (dragTarget) {
        let point = sceneThis.world.toLocal(event.global);
        if (sceneThis.world.containsPoint(point)) {
          dragTarget.sprite.position.copyFrom(point);
        }
      }
    }

    function onDragEnd() {
      if (dragTarget) {
        sceneThis.worldContainer.off('pointermove', onDragMove);
        dragTarget.sprite.alpha = 1;
        sceneThis.handlePieceSnap(dragTarget);
        dragTarget = null;
      }
      sceneThis.worldContainer.resume();
    }

    this.worldContainer.on('pointerupoutside', onDragEnd);
    this.worldContainer.on('pointerup', onDragEnd);

    this.taggedPieces.forEach(piece => {
      piece.sprite.eventMode = "static";
      piece.sprite.cursor = "pointer";
      piece.sprite.on('pointerdown', onDragStart, piece);
    });
  }

  private handlePieceSnap(piece: JigsawPiece) {
    for (let i = 0; i < piece.neighbours.length; i++) {
      const id = piece.neighbours[i].id;
      const direction = piece.neighbours[i].direction;
      const neighbour = this.taggedPieces[id];

      const wiggleRoom = this.tileWidth / 4;
      const distance = PixiUtils.getDistanceToNeighbourTab(this.world, piece!.sprite, neighbour.sprite, wiggleRoom, direction);
      //console.log("distance to neighbour", distance);
      if (distance <= this.tileWidth / 2) {
        piece!.sprite.pivot.copyFrom(piece!.originalPivot);
        piece!.sprite.position.copyFrom(piece!.originalPivot);

        const neighbourPivot = this.world.toLocal(neighbour.originalPivot, neighbour.sprite);

        // TODO: group into container, containers can also be moved and snapped
        // also probably should start thinking about the network protocol
        switch (direction) {
          case "top": {
            piece!.sprite.position.set(neighbourPivot.x, neighbourPivot.y + this.tileWidth);
            break;
          }
          case "bottom": {
            piece!.sprite.position.set(neighbourPivot.x, neighbourPivot.y - this.tileWidth);
            break;
          }
          case "left": {
            piece!.sprite.position.set(neighbourPivot.x + this.tileWidth, neighbourPivot.y);
            break;
          }
          case "right": {
            piece!.sprite.position.set(neighbourPivot.x - this.tileWidth, neighbourPivot.y);
            break;
          }
        }
        break;
      }
    }
  }

  public update(ticker: PIXI.Ticker) {
    const currentMousePos = SceneManager.appRenderer.events.pointer.global;
    const worldPointer = new PIXI.Point(
      (currentMousePos.x - this.worldContainer.x) / this.worldContainer.scale.x,
      (currentMousePos.y - this.worldContainer.y) / this.worldContainer.scale.y
    );

    if (this.prevWorldPointer.x != worldPointer.x && this.prevWorldPointer.y != worldPointer.y && this.world.containsPoint(worldPointer)) {
      const message = new MessageEncoder();
      const cursor = new CursorMessage(worldPointer.x, worldPointer.y);
      cursor.encode(message);
      this.peerManager.broadcastMessage(message.getBuffer());
    }

    this.prevWorldPointer = worldPointer;
  }

  public resize(width: number, height: number) {

  }

}
