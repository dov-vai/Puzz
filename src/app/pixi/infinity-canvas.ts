import * as PIXI from 'pixi.js';

export class InfinityCanvas extends PIXI.Container {
  private events: PIXI.EventSystem;
  private dragging: boolean;
  private dragStart: PIXI.Point;
  private paused: boolean;
  private touchMode: "single" | "double";
  private prevTouch: Touch[];

  constructor(events: PIXI.EventSystem) {
    super();
    this.events = events;
    this.dragging = false;
    this.dragStart = new PIXI.Point();
    this.paused = false;
    this.touchMode = "single";
    this.prevTouch = new Array(2);

    this.setupEvents();
  }

  private setupEvents() {
    const eventElement = this.events.domElement;
    eventElement.addEventListener('wheel', this.zoomEvent.bind(this));
    eventElement.addEventListener('contextmenu', this.dragStartEvent.bind(this));
    eventElement.addEventListener('pointermove', this.panEvent.bind(this));
    eventElement.addEventListener('pointerup', this.pointerUpEvent.bind(this));
    eventElement.addEventListener('pointerleave', this.pointerUpEvent.bind(this));
    eventElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    eventElement.addEventListener('touchmove', this.onTouchMove.bind(this));
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  private zoomEvent(event: WheelEvent) {
    let scaleFactor = event.deltaY < 0 ? 1.5 : 0.66;
    this.applyScale(scaleFactor, event.clientX, event.clientY);
  }

  public applyScale(scaleFactor: number, x: number, y: number) {
    let worldPos = new PIXI.Point(
      (x - this.x) / this.scale.x,
      (y - this.y) / this.scale.y
    );
    let newScale = new PIXI.Point(
      this.scale.x * scaleFactor,
      this.scale.y * scaleFactor
    );

    // limit scale so user doesn't lose the world
    if (newScale.x >= 1 || newScale.x < 0.05 || newScale.y >= 1 || newScale.y < 0.05)
      return;

    // apply zoom, convert new world coordinates back to screen coordinates
    let newScreenPos = new PIXI.Point(
      (worldPos.x) * newScale.x + this.x,
      (worldPos.y) * newScale.y + this.y
    );

    // adjust the difference after zooming based on pointer location
    // (mouse pointer before zoom) - (after zoom)
    this.x += x - newScreenPos.x;
    this.y += y - newScreenPos.y;
    this.scale.x = newScale.x;
    this.scale.y = newScale.y;
  }

  private onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchMode = "single";
    } else if (event.touches.length >= 2) {
      this.touchMode = "double";
    }

    this.prevTouch[0] = event.touches[0];
    this.prevTouch[1] = event.touches[1];

    this.onTouchMove(event);
  }

  private onTouchMove(event: TouchEvent) {
    const touch0X = event.touches[0].clientX;
    const touch0Y = event.touches[0].clientY;
    const prevTouch0X = this.prevTouch[0].clientX;
    const prevTouch0Y = this.prevTouch[0].clientY;

    if (this.touchMode === "double") {
      const touch1X = event.touches[1].clientX;
      const touch1Y = event.touches[1].clientY;
      const prevTouch1X = this.prevTouch[1].clientX;
      const prevTouch1Y = this.prevTouch[1].clientY;

      const previousDistance = Math.sqrt(
        Math.pow(prevTouch0X - prevTouch1X, 2) + Math.pow(prevTouch0Y - prevTouch1Y, 2)
      );

      const currentDistance = Math.sqrt(
        Math.pow(touch0X - touch1X, 2) + Math.pow(touch0Y - touch1Y, 2)
      );

      const scaleFactor = currentDistance / previousDistance;

      const prevMidX = (prevTouch0X + prevTouch1X) / 2;
      const prevMidY = (prevTouch0Y + prevTouch1Y) / 2;

      const midX = (touch0X + touch1X) / 2;
      const midY = (touch0Y + touch1Y) / 2;

      this.applyScale(scaleFactor, midX, midY);

      this.x += midX - prevMidX;
      this.y += midY - prevMidY;
    }

    this.prevTouch[0] = event.touches[0];
    this.prevTouch[1] = event.touches[1];
  }

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
