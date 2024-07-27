import * as PIXI from 'pixi.js';
import {EventSystem} from 'pixi.js';

export class InfinityCanvas extends PIXI.Container {
  private events: EventSystem;
  private worldWidth: number;
  private worldHeight: number;
  public dragging: boolean;

  constructor(events: EventSystem, worldWidth: number, worldHeight: number) {
    super();
    this.events = events;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.dragging = false;

    this.setupEvents();
  }

  private setupEvents() {
    const eventElement = this.events.domElement;
    let dragStart = new PIXI.Point();

    eventElement.addEventListener('wheel', event => {
      let scaleFactor = event.deltaY < 0 ? 1.5 : 0.66;
      // mouse pointer position in the world (screen coordinates to world)
      let worldPos = new PIXI.Point(
        (event.clientX - this.x) / this.scale.x,
        (event.clientY - this.y) / this.scale.y
      );
      let newScale = new PIXI.Point(
        this.scale.x * scaleFactor,
        this.scale.y * scaleFactor
      );
      // apply zoom, convert new world coordinates back to screen coordinates
      let newScreenPos = new PIXI.Point(
        (worldPos.x) * newScale.x + this.x,
        (worldPos.y) * newScale.y + this.y
      );

      // adjust the difference after zooming based on pointer location
      // (mouse pointer before zoom) - (after zoom)
      this.x += event.clientX - newScreenPos.x;
      this.y += event.clientY - newScreenPos.y;
      this.scale.x = newScale.x;
      this.scale.y = newScale.y;
    });

    eventElement.addEventListener('pointerdown', event => {
      this.dragging = true;
      dragStart.set(event.clientX, event.clientY);
    });

    eventElement.addEventListener('pointermove', event => {
      if (this.dragging) {
        this.x += event.clientX - dragStart.x;
        this.y += event.clientY - dragStart.y;
        dragStart.set(event.clientX, event.clientY);
      }
    });

    eventElement.addEventListener('pointerup', () => {
      this.dragging = false;
    });

    eventElement.addEventListener('pointerleave', () => {
      this.dragging = false;
    });

  }
}
