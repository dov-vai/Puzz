import * as PIXI from 'pixi.js';
import {Peer} from "../../services/peer-manager/peer";
import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {DragAndDropHandler} from "./drag-and-drop-handler";
import {ImageLoader, JigsawImage} from "./image-loader";
import {PlayerManager} from "./player-manager";
import {SyncHandler} from "./sync-handler";


export class JigsawManager {
  private jigsawPieceManager: JigsawPieceManager;
  private dragAndDropHandler: DragAndDropHandler;
  private imageLoader: ImageLoader;
  private playerManager: PlayerManager;
  private syncHandler: SyncHandler;

  constructor(worldContainer: PIXI.Container, world: PIXI.Graphics, image?: File) {
    this.imageLoader = new ImageLoader();
    this.jigsawPieceManager = new JigsawPieceManager(worldContainer, world);
    this.dragAndDropHandler = new DragAndDropHandler(this.jigsawPieceManager);
    this.playerManager = new PlayerManager(this.jigsawPieceManager);
    this.syncHandler = new SyncHandler(this.jigsawPieceManager);

    if (image) {
      this.readAsDataUrl(image).then(uri => {
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
      this.imageLoader.requestImage(peer).then(jigsaw => this.init(jigsaw))
    }
  }

  // FIXME: method shouldn't be in this class
  private async readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string)
      }
      reader.onerror = (event) => {
        reject(event.target?.error)
      }
      reader.readAsDataURL(file)
    })
  }
}
