import * as PIXI from 'pixi.js';

export interface IScene extends PIXI.Container {
  update(ticker: PIXI.Ticker): void;

  resize(width: number, height: number): void;
}

export class SceneManager {
  private constructor() {
  }

  private static app: PIXI.Application;
  private static currentScene: IScene;

  // exposed for the infinity canvas, global pointer location, rendering jigsaw pieces
  public static get appRenderer(): PIXI.Renderer {
    return this.app.renderer;
  }

  public static get width(): number {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  }

  public static get height(): number {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

  public static async initialize(canvas: HTMLCanvasElement, backgroundColor: number, image: File) {
    SceneManager.app = new PIXI.Application();

    // for pixi js devtools extension
    (window as any).__PIXI_APP__ = SceneManager.app;

    await SceneManager.app.init({
      canvas: canvas,
      resizeTo: window,
      roundPixels: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      background: backgroundColor,
    });

    await SceneManager.initializeAssets(image);

    SceneManager.app.ticker.add((ticker) => SceneManager.update(ticker));
    window.addEventListener("resize", SceneManager.resize);

  }

  private static async initializeAssets(image: File) {
    const url = await SceneManager.readAsDataUrl(image);
    await PIXI.Assets.load({alias: "image", src: url});
  }

  private static async readAsDataUrl(file: File): Promise<string> {
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

  public static changeScene(newScene: IScene) {
    if (SceneManager.currentScene) {
      SceneManager.app.stage.removeChild(SceneManager.currentScene);
      SceneManager.currentScene.destroy();
    }

    SceneManager.currentScene = newScene;
    SceneManager.app.stage.addChild(SceneManager.currentScene);
  }

  public static update(ticker: PIXI.Ticker) {
    if (SceneManager.currentScene) {
      SceneManager.currentScene.update(ticker);
    }
  }

  public static resize() {
    if (SceneManager.currentScene) {
      SceneManager.currentScene.resize(SceneManager.width, SceneManager.height);
    }
  }

  public static destroy() {
    if (SceneManager.app) {
      SceneManager.app.destroy();
    }
  }
}
