import {IScene, SceneManager} from "../scene-manager";
import * as PIXI from "pixi.js";
import {InfinityCanvas} from "../infinity-canvas";
import {PeerManagerService} from "../../services/peer-manager/peer-manager.service";
import {MessageEncoder} from "../../network/message-encoder";
import {CursorMessage} from "../../network/protocol/cursor-message";
import {JigsawManager} from "./jigsaw-manager";

export class JigsawScene extends PIXI.Container implements IScene {
  private worldContainer: InfinityCanvas;
  private world: PIXI.Graphics;
  private prevWorldPointer: PIXI.Point;
  private jigsawManager: JigsawManager;
  private worldSize: number;

  constructor(private peerManager: PeerManagerService, private image?: File) {
    super();
    this.worldSize = 5000;
    this.prevWorldPointer = new PIXI.Point();

    this.worldContainer = new InfinityCanvas(SceneManager.appRenderer.events);
    this.worldContainer.sortableChildren = true;
    this.centerWorld();
    this.world = new PIXI.Graphics().rect(0, 0, this.worldSize, this.worldSize).fill({color: 0x424769});
    this.worldContainer.addChild(this.world);
    this.addChild(this.worldContainer);
    this.jigsawManager = new JigsawManager(this.worldContainer, this.world, this.image);
    this.setupP2P();
  }

  private centerWorld() {
    this.worldContainer.setWorldPosition(SceneManager.width / 2 - this.worldSize / 2, SceneManager.height / 2 - this.worldSize / 2);
  }

  private setupP2P() {
    this.peerManager.onDataChannelOpen = (peer) => {
      peer.binaryType = "arraybuffer";
      this.jigsawManager.onConnected(peer);
    };
  }

  public update(ticker: PIXI.Ticker) {
    // FIXME: needs to be moved
    const currentMousePos = SceneManager.appRenderer.events.pointer.global;
    const worldPointer = this.world.toLocal(currentMousePos);

    if ((this.prevWorldPointer.x != worldPointer.x || this.prevWorldPointer.y != worldPointer.y) && this.world.containsPoint(worldPointer)) {
      const message = new MessageEncoder();
      const cursor = new CursorMessage(worldPointer.x, worldPointer.y, undefined);
      cursor.encode(message);
      this.peerManager.broadcastMessage(message.getBuffer());
    }

    this.prevWorldPointer = worldPointer;
  }

  public resize(width: number, height: number) {

  }

}
