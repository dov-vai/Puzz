import {IScene, SceneManager} from "../scene-manager";
import * as PIXI from "pixi.js";
import {sound} from "@pixi/sound";
import {InfinityCanvas} from "../infinity-canvas";
import {PeerManagerService} from "../../services/peer-manager/peer-manager.service";
import {JigsawManager} from "./jigsaw-manager";

export const SNAP_SOUND = 'snap';

export class JigsawScene extends PIXI.Container implements IScene {
  private worldContainer: InfinityCanvas;
  private jigsawManager: JigsawManager;

  constructor(private peerManager: PeerManagerService, private image?: File, pieces?: number) {
    super();
    sound.add(SNAP_SOUND, 'snap.wav');
    this.worldContainer = new InfinityCanvas(SceneManager.appRenderer.events);
    this.worldContainer.sortableChildren = true;
    this.addChild(this.worldContainer);
    this.jigsawManager = new JigsawManager(this.worldContainer, this.image, pieces);
    this.setupP2P();
  }

  private setupP2P() {
    this.peerManager.onDataChannelOpen = (peer) => {
      peer.binaryType = "arraybuffer";
      this.jigsawManager.onConnected(peer);
    };
  }

  public update(ticker: PIXI.Ticker) {
    this.jigsawManager.update(ticker);
  }

  public resize(width: number, height: number) {

  }

  public getImageUri() {
    return this.jigsawManager.getImageUri();
  }

}
