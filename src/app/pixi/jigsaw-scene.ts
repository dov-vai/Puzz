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
import {JigsawNeighbour, JigsawPiece} from "./jigsaw-piece";
import {ImageRequestMessage} from "../network/protocol/image-request-message";
import {FileReceiveMessage} from "../network/protocol/file-receive-message";
import {FileChunkMessage} from "../network/protocol/file-chunk-message";
import {SnapMessage} from "../network/protocol/snap-message";
import {SyncContainer, SyncMessage, SyncPiece} from "../network/protocol/sync-message";
import {SyncRequestMessage} from "../network/protocol/sync-request-message";

export class JigsawScene extends PIXI.Container implements IScene {
  private worldContainer: InfinityCanvas;
  private world: PIXI.Graphics;
  private prevWorldPointer: PIXI.Point;
  private taggedPieces!: JigsawPiece[];
  private tileWidth!: number;
  private dragTarget: JigsawPiece | null;
  private image: PIXI.Texture | undefined;

  constructor(private peerManager: PeerManagerService) {
    super();
    this.prevWorldPointer = new PIXI.Point();
    this.dragTarget = null;

    // setup the infinity canvas
    const worldSize = 5000;
    this.worldContainer = new InfinityCanvas(SceneManager.appRenderer.events, worldSize, worldSize);
    this.worldContainer.sortableChildren = true;
    this.world = new PIXI.Graphics().rect(0, 0, worldSize, worldSize).fill({color: 0x424769});
    this.worldContainer.addChild(this.world);

    this.setupP2P();

    // initialized in the scene manager so shouldn't need to load
    this.image = PIXI.Assets.get("image");

    // we are the host so can load immediately
    if (this.image) {
      this.loadPieces(this.image);
    }

    this.addChild(this.worldContainer);
  }

  private loadPieces(image: PIXI.Texture) {
    this.tileWidth = 100;
    const generator = new JigsawGenerator(image, this.tileWidth);
    this.taggedPieces = generator.generatePieces(5, 0x000000, SceneManager.appRenderer);
    // setup dragging and dropping jigsaw pieces
    this.setupEvents();
    generator.placePieces(this.worldContainer, this.taggedPieces, new PIXI.Point(this.world.width / 2, this.world.height / 2));
  }

  private setupP2P() {
    const cursor = new PIXI.GraphicsContext()
      .circle(0, 0, 8)
      .fill({color: 0xffffff})
      .stroke({color: 0x111111, alpha: 0.87, width: 1})

    let imageBuffer: Uint8Array;
    let bufferOffset: number;

    this.peerManager.onDataChannelOpen = (channel) => {
      let lastPickedPiece: number = -1;

      const peerCursor = this.worldContainer.addChild(
        new PIXI.Graphics(cursor)
      );
      peerCursor.zIndex = 2;

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
              const cursorPosition = new PIXI.Point(cursor.x, cursor.y);
              peerCursor.position.copyFrom(cursorPosition);
              if (cursor.piece != undefined) {
                let target: JigsawPiece | PIXI.Container = this.taggedPieces[cursor.piece];
                if (target.parent != this.worldContainer) {
                  target = target.parent;
                }
                const pivotCoords = target.toLocal(cursorPosition, this.world);
                if (lastPickedPiece != cursor.piece) {
                  // TODO: more foolproof pivot setting?
                  target.zIndex = 1;
                  target.pivot.copyFrom(pivotCoords);
                }
                target.position.copyFrom(cursorPosition);
                lastPickedPiece = cursor.piece;
              } else {
                if (lastPickedPiece != -1) {
                  let target: JigsawPiece | PIXI.Container = this.taggedPieces[lastPickedPiece];
                  if (target.parent != this.worldContainer) {
                    target = target.parent;
                  }
                  target.zIndex = 0;
                }

                lastPickedPiece = -1;
              }
              peerCursor.scale.x = 1 / this.worldContainer.scale.x;
              peerCursor.scale.y = 1 / this.worldContainer.scale.y;
              break;
            }
            case MessageType.FileReceive: {
              const fileReceive = new FileReceiveMessage();
              fileReceive.decode(decoder);
              imageBuffer = new Uint8Array(fileReceive.size);
              bufferOffset = 0;
              break;
            }
            case MessageType.FileChunk: {
              if (bufferOffset === imageBuffer.length) {
                break;
              }

              const fileChunk = new FileChunkMessage();
              fileChunk.decode(decoder);
              imageBuffer.set(new Uint8Array(fileChunk.buffer!), bufferOffset);
              bufferOffset += fileChunk.buffer!.byteLength;

              if (bufferOffset === imageBuffer.length) {
                const decoder = new MessageDecoder(imageBuffer.buffer);
                PIXI.Assets.load(decoder.decodeString(bufferOffset)).then((texture: PIXI.Texture) => {
                  this.loadPieces(texture);
                  const encoder = new MessageEncoder();
                  const syncRequest = new SyncRequestMessage();
                  syncRequest.encode(encoder);
                  this.peerManager.broadcastMessage(encoder.getBuffer())
                })
              }
              break;
            }
            case MessageType.ImageRequest: {
              if (!this.peerManager.host) {
                break;
              }

              const encoder = new MessageEncoder();
              const buffer = this.convertStringToBinary(this.image?.source._sourceOrigin!);
              const fileReceive = new FileReceiveMessage("image", buffer.byteLength);
              fileReceive.encode(encoder);
              channel.send(encoder.getBuffer());

              // TODO: expensive operation, should be async
              const chunkSize = 15 * 1024;
              let size = 0;
              while (size < buffer.byteLength) {
                const encoder = new MessageEncoder();
                const end = Math.min(chunkSize, buffer.byteLength - size);
                const fileChunk = new FileChunkMessage(buffer.slice(size, size + end), end);
                fileChunk.encode(encoder);
                channel.send(encoder.getBuffer());
                size += end;
              }
              break;
            }
            case MessageType.Snap: {
              const snap = new SnapMessage();
              snap.decode(decoder);
              this.handlePieceSnap(this.taggedPieces[snap.pieceId], this.taggedPieces[snap.pieceId].neighbours[snap.neighbourId])
              break;
            }
            case MessageType.SyncRequest: {
              if (!this.peerManager.host) {
                break;
              }

              const pieces: SyncPiece[] = [];
              const containers: SyncContainer[] = [];

              const checkedPieces: Set<number> = new Set();
              for (let piece of this.taggedPieces) {
                if (checkedPieces.has(piece.id)) {
                  continue;
                }

                if (piece.parent != this.worldContainer) {
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
              channel.send(encoder.getBuffer());
              break;
            }
            case MessageType.Sync: {
              const sync = new SyncMessage();
              sync.decode(decoder);

              for (let syncPiece of sync.pieces) {
                const piece = this.taggedPieces[syncPiece.id];
                piece.pivot.set(syncPiece.pivotX, syncPiece.pivotY);
                piece.position.set(syncPiece.x, syncPiece.y);
              }

              for (let container of sync.containers) {
                // hash set for faster neighbour lookup
                const pieceSet = new Set(container.pieceIds);
                for (let containerPiece of container.pieceIds) {
                  const piece = this.taggedPieces[containerPiece];
                  for (let neighbour of piece.neighbours) {
                    if (pieceSet.has(neighbour.id)) {
                      this.handlePieceSnap(piece, neighbour);
                    }
                  }
                }
                // pick the first one just to get the parent container
                const piece = this.taggedPieces[container.pieceIds[0]];
                const containerPivot = piece.parent?.toLocal(
                  new PIXI.Point(container.pivotX, container.pivotY),
                  this.taggedPieces[container.pivotPiece]
                );
                piece.parent?.pivot.copyFrom(containerPivot);
                piece.parent.position.set(container.x, container.y);
              }
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

      // TODO: should probably be initialized somewhere else
      // we are not the host, so we need an image
      if (!this.image && !this.peerManager.host) {
        const encoder = new MessageEncoder();
        const imageRequest = new ImageRequestMessage();
        imageRequest.encode(encoder)
        // TODO: distinguish host from peers, so broadcasting won't be necessary
        this.peerManager.broadcastMessage(encoder.getBuffer());
      }
    };
  }

  private convertStringToBinary(value: string) {
    const encoder = new MessageEncoder();
    encoder.encodeString(value, value.length);
    return encoder.getBuffer();
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

      target.zIndex = 1;
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
          sceneThis.dragTarget.parent.zIndex = 0;
          sceneThis.checkContainerSnap(sceneThis.dragTarget.parent);
        } else {
          sceneThis.dragTarget.alpha = 1;
          sceneThis.dragTarget.zIndex = 0;
          sceneThis.checkPieceSnap(sceneThis.dragTarget);
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

  private checkPieceSnap(piece: JigsawPiece): boolean {
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
        this.handlePieceSnap(piece, piece.neighbours[i]);
        const encoder = new MessageEncoder();
        // TODO: jigsaw neighbour should probably be a hashmap with actual ids instead of passing the array index
        const snap = new SnapMessage(piece.id, i);
        snap.encode(encoder);
        this.peerManager.broadcastMessage(encoder.getBuffer());
        return true;
      }
    }
    return false;
  }


  private handlePieceSnap(piece: JigsawPiece, jigsawNeighbour: JigsawNeighbour) {
    const neighbour = this.taggedPieces[jigsawNeighbour.id];
    const pieceInContainer = piece.parent != this.worldContainer;
    const neighbourInContainer = neighbour.parent != this.worldContainer

    if (pieceInContainer && neighbourInContainer && piece.parent === neighbour.parent) {
      return;
    }

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

    switch (jigsawNeighbour.direction) {
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
      // set container position and pivot because on creation it's (0,0)
      // which causes issues when syncing clients
      container.pivot.copyFrom(piece);
      container.position.copyFrom(piece);
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
  }

  public update(ticker: PIXI.Ticker) {
    const currentMousePos = SceneManager.appRenderer.events.pointer.global;
    const worldPointer = this.world.toLocal(currentMousePos);

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
