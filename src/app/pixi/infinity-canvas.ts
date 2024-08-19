import * as PIXI from 'pixi.js';
import {EventSystem} from 'pixi.js';

export class InfinityCanvas extends PIXI.Container {
  private events: EventSystem;
  private worldWidth: number;
  private worldHeight: number;
  private dragging: boolean;
  private dragStart: PIXI.Point;
  private paused: boolean;

  constructor(events: EventSystem, worldWidth: number, worldHeight: number) {
    super();
    this.events = events;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.dragging = false;
    this.dragStart = new PIXI.Point();
    this.paused = false;

    this.setupEvents();
  }

  private setupEvents() {
    const eventElement = this.events.domElement;
    eventElement.addEventListener('wheel', this.zoomEvent.bind(this));
    eventElement.addEventListener('contextmenu', this.dragStartEvent.bind(this));
    eventElement.addEventListener('pointermove', this.panEvent.bind(this));
    eventElement.addEventListener('pointerup', this.pointerUpEvent.bind(this));
    eventElement.addEventListener('pointerleave', this.pointerUpEvent.bind(this));
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  setWorldPosition(x: number, y: number){
    this.position.set(x,y);
  }

  private zoomEvent(event: WheelEvent) {
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
  }

  private dragStartEvent(event: PointerEvent) {
  private dragStartEvent(event: MouseEvent) {
    event.preventDefault();

    if (this.paused) {
      return;
    }

    this.dragging = true;
    this.dragStart.set(event.clientX, event.clientY);
  }

  private panEvent(event: PointerEvent) {
    if (this.paused) {
      return;
    }

    if (this.dragging) {
      this.x += event.clientX - this.dragStart.x;
      this.y += event.clientY - this.dragStart.y;
      this.dragStart.set(event.clientX, event.clientY);
    }
  }

  private pointerUpEvent() {
    if (this.paused) {
      return;
    }

    this.dragging = false;
  }
}
