import {Injectable} from '@angular/core';
import {PeerManagerService} from "../peer-manager/peer-manager.service";
import * as PIXI from "pixi.js";
import {InfinityCanvas} from "../../pixi/infinity-canvas";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private app!: PIXI.Application;
  private worldContainer!: PIXI.Container;

  constructor(private peerManager: PeerManagerService) {
  }

  async init(canvas: HTMLCanvasElement) {
    let app = new PIXI.Application();
    (globalThis as any).__PIXI_APP__ = app;

    await app.init({
      canvas: canvas,
      antialias: false,
      width: window.innerWidth - 20,
      height: window.innerHeight - 20,
      background: '#2D3250'
    });

    canvas.focus();

    let worldSize = 5000;
    this.worldContainer = new InfinityCanvas(app.renderer.events, worldSize, worldSize);
    let world = new PIXI.Graphics().rect(0, 0, worldSize, worldSize).fill({color: 0x424769});
    this.worldContainer.addChild(world);
    app.stage.addChild(this.worldContainer);

    const cursor = new PIXI.GraphicsContext()
      .circle(0, 0, 8)
      .fill({color: 0xffffff})
      .stroke({color: 0x111111, alpha: 0.87, width: 1})

    const myCursor = new PIXI.Graphics(cursor);
    myCursor.position.set(app.screen.width / 2, app.screen.height / 2);

    app.stage.addChild(myCursor);

    let currentMousePos = new PIXI.Point();

    app.stage.addEventListener('pointermove', e => {
      myCursor.position.copyFrom(e.global);
      currentMousePos = e.global;
    });

    this.peerManager.onDataChannelOpen = (channel) => {
      const peerCursor = this.worldContainer.addChild(
        new PIXI.Graphics(cursor)
      );

      channel.onclose = () => {
        this.worldContainer.removeChild(peerCursor);
      }

      channel.onmessage = (msg => {
        peerCursor.position.copyFrom(JSON.parse(msg.data));
        peerCursor.scale.x = 1 / this.worldContainer.scale.x;
        peerCursor.scale.y = 1 / this.worldContainer.scale.y;
      })
    };

    let prevWorldPointer = new PIXI.Point();
    app.ticker.add((ticker) => {
      let worldPointer = new PIXI.Point(
        (currentMousePos.x - this.worldContainer.x) / this.worldContainer.scale.x,
        (currentMousePos.y - this.worldContainer.y) / this.worldContainer.scale.y
      );

      if (prevWorldPointer.x != worldPointer.x && prevWorldPointer.y != worldPointer.y && world.containsPoint(worldPointer)) {
        this.peerManager.brodcastMessage(JSON.stringify(worldPointer));
      }

      prevWorldPointer = worldPointer;

    });
  }

  destroy() {
    this.app.destroy();
  }

}
