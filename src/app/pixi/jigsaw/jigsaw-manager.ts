import * as PIXI from 'pixi.js';
import {Peer} from "../../services/peer-manager/peer";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {DragAndDropHandler} from "./drag-and-drop-handler";
import {ImageLoader, JigsawImage} from "./image-loader";
import {PlayerManager} from "./player-manager";
import {SyncHandler} from "./sync-handler";
import {SceneManager} from "../scene-manager";
import {MessageEncoder} from "../../network/message-encoder";
import {CursorMessage} from "../../network/protocol/cursor-message";
import {PixiUtils} from "../utils";
import {SyncRequestMessage} from "../../network/protocol/sync-request-message";


export class JigsawManager {
  private jigsawPieceManager: JigsawPieceManager;
  private dragAndDropHandler: DragAndDropHandler;
  private imageLoader: ImageLoader;
  private playerManager: PlayerManager;
  private syncHandler: SyncHandler;
  private prevWorldPointer: PIXI.Point;

  constructor(private worldContainer: PIXI.Container, private world: PIXI.Graphics, image?: File) {
    this.imageLoader = new ImageLoader();
    this.jigsawPieceManager = new JigsawPieceManager(worldContainer, world);
    this.playerManager = new PlayerManager(this.jigsawPieceManager);
    this.dragAndDropHandler = new DragAndDropHandler(this.jigsawPieceManager, this.playerManager);
    this.syncHandler = new SyncHandler(this.jigsawPieceManager);
    this.prevWorldPointer = new PIXI.Point();

    if (image) {
      PixiUtils.readAsDataUrl(image).then(uri => {
        this.imageLoader.loadImage(uri).then(jigsaw => this.init(jigsaw))
      })
    }
  }

  private init(jigsaw: JigsawImage) {
    this.jigsawPieceManager.loadPieces(jigsaw.image, jigsaw.seed);
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
      const cursor = new CursorMessage(worldPointer.x, worldPointer.y, this.dragAndDropHandler.dragTarget?.id);
      cursor.encode(message);
      this.playerManager.broadcast(message.getBuffer());
    }

    this.prevWorldPointer = worldPointer;
  }
}
