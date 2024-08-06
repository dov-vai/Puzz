import {Injectable} from '@angular/core';
import {PeerManagerService} from "../peer-manager/peer-manager.service";
import {SceneManager} from "../../pixi/scene-manager";
import {JigsawScene} from "../../pixi/jigsaw-scene";

// this is maybe not correct but Angular doesn't provide dependency injection to non-services?
@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private peerManager: PeerManagerService) {
  }

  async init(canvas: HTMLCanvasElement) {
    await this.peerManager.init();

    await SceneManager.initialize(canvas, 0x2d3250);

    const scene = new JigsawScene(this.peerManager);

    SceneManager.changeScene(scene);
  }

  destroy() {
    SceneManager.destroy();
    this.peerManager.destroy();
  }

}
