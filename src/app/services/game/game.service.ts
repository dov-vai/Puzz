import {Injectable} from '@angular/core';
import {PeerManagerService} from "../peer-manager/peer-manager.service";
import {SceneManager} from "../../pixi/scene-manager";
import {JigsawScene} from "../../pixi/jigsaw/jigsaw-scene";

// this is maybe not correct but Angular doesn't provide dependency injection to non-services?
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private scene!: JigsawScene;

  constructor(private peerManager: PeerManagerService) {
  }

  async init(canvas: HTMLCanvasElement, image?: File, pieces?: number) {
    await SceneManager.initialize(canvas, 0x2d3250);
    this.scene = new JigsawScene(this.peerManager, image, pieces);
    // must be called after scene setup as the onDataChannelOpen function variable won't get set!
    await this.peerManager.init();
    SceneManager.changeScene(this.scene);
  }

  destroy() {
    SceneManager.destroy();
    this.peerManager.destroy();
  }

  getImageUri() {
    return this.scene?.getImageUri();
  }
}
