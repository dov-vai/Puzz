import * as PIXI from 'pixi.js';
import {Peer} from "../../services/peer-manager/peer";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {DragAndDropHandler} from "./drag-and-drop-handler";
import {ImageLoader, JigsawImage} from "./image-loader";
import {PlayerManager} from "./player-manager";
import {SyncHandler} from "./sync-handler";
import {SceneManager} from "../scene-manager";
import {MessageEncoder} from "../../network/message-encoder";
import {CursorMessage, PickedPiece} from "../../network/protocol/cursor-message";
import {SyncRequestMessage} from "../../network/protocol/sync-request-message";


export class JigsawManager {
  private jigsawPieceManager: JigsawPieceManager;
  private dragAndDropHandler: DragAndDropHandler;
  private imageLoader: ImageLoader;
  private playerManager: PlayerManager;
  private syncHandler: SyncHandler;
  private prevWorldPointer: PIXI.Point;

  constructor(private worldContainer: PIXI.Container, private world: PIXI.Graphics, image?: File, pieces?: number) {
    this.imageLoader = new ImageLoader();
    this.jigsawPieceManager = new JigsawPieceManager(worldContainer, world);
    this.playerManager = new PlayerManager(this.jigsawPieceManager);
    this.dragAndDropHandler = new DragAndDropHandler(this.jigsawPieceManager, this.playerManager);
    this.syncHandler = new SyncHandler(this.jigsawPieceManager);
    this.prevWorldPointer = new PIXI.Point();

    if (image && pieces) {
      this.imageLoader.loadImage(image, pieces).then(jigsaw => this.init(jigsaw));
    }
  }

  private init(jigsaw: JigsawImage) {
    this.jigsawPieceManager.loadPieces(jigsaw.texture, jigsaw.seed, jigsaw.pieces);
    this.dragAndDropHandler.setupEvents();
  }

  public onConnected(peer: Peer) {
    this.playerManager.addPlayer(peer);
    peer.registerMessageHandler(this.imageLoader.handle.bind(this.imageLoader));
    peer.registerMessageHandler(this.syncHandler.handle.bind(this.syncHandler));
    if (peer.isHost) {
      this.imageLoader.requestImage(peer)
        .then(jigsaw => this.init(jigsaw))
        .then(() => {
          const encoder = new MessageEncoder();
          const sync = new SyncRequestMessage();
          sync.encode(encoder);
          this.playerManager.broadcast(encoder.getBuffer());
        })
    }
  }

  update(ticker: PIXI.Ticker) {
    this.broadcastPointer()
  }

  // TODO: still needs a better place for it to reside...
  broadcastPointer() {
    const currentMousePos = SceneManager.appRenderer.events.pointer.global;
    const worldPointer = this.world.toLocal(currentMousePos);

    if ((this.prevWorldPointer.x != worldPointer.x || this.prevWorldPointer.y != worldPointer.y) && this.world.containsPoint(worldPointer)) {
      const message = new MessageEncoder();
      const target = this.dragAndDropHandler.dragTarget;
      let piece: PickedPiece | undefined;
      if (target) {
        const piecePivot = target.toLocal(worldPointer, this.world);
        piece = {
          id: target.id,
          pivotX: piecePivot.x,
          pivotY: piecePivot.y,
        }
      }
      const cursor = new CursorMessage(worldPointer.x, worldPointer.y, piece);
      cursor.encode(message);
      this.playerManager.broadcast(message.getBuffer());
    }

    this.prevWorldPointer = worldPointer;
  }

  // TODO: create a command system, passing every command as a separate function from the overlay through 3 layers is annoying
  public getImageUri() {
    return this.imageLoader.uri;
  }
}
