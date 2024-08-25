import * as PIXI from 'pixi.js';

export class PixiUtils {
  private constructor() {
  }

  static getDistance(point1: PIXI.Point, point2: PIXI.Point) {
    const a = point1.x - point2.x;
    const b = point1.y - point2.y;
    return Math.sqrt(a * a + b * b);
  }

  static getDistanceToNeighbourTab(
    world: PIXI.Container,
    piece: PIXI.Sprite,
    neighbour: PIXI.Sprite,
    offset: number,
    direction: "top" | "bottom" | "left" | "right"
  ) {
    switch (direction) {
      case "top": {
        const pieceTab = PixiUtils.getJigsawTabPoint(world, piece, offset, "top");
        const neighbourTab = PixiUtils.getJigsawTabPoint(world, neighbour, offset, "bottom");
        return PixiUtils.getDistance(pieceTab, neighbourTab);
      }
      case "bottom": {
        const pieceTab = PixiUtils.getJigsawTabPoint(world, piece, offset, "bottom");
        const neighbourTab = PixiUtils.getJigsawTabPoint(world, neighbour, offset, "top");
        return PixiUtils.getDistance(pieceTab, neighbourTab);
      }
      case "left": {
        const pieceTab = PixiUtils.getJigsawTabPoint(world, piece, offset, "left");
        const neighbourTab = PixiUtils.getJigsawTabPoint(world, neighbour, offset, "right");
        return PixiUtils.getDistance(pieceTab, neighbourTab);
      }
      case "right": {
        const pieceTab = PixiUtils.getJigsawTabPoint(world, piece, offset, "right");
        const neighbourTab = PixiUtils.getJigsawTabPoint(world, neighbour, offset, "left");
        return PixiUtils.getDistance(pieceTab, neighbourTab);
      }
    }
  }

  static getJigsawTabPoint(
    world: PIXI.Container,
    sprite: PIXI.Sprite,
    offset: number,
    direction: "top" | "bottom" | "left" | "right"
  ): PIXI.Point {
    const midpoint = new PIXI.Point(sprite.width / 2, sprite.width / 2);
    switch (direction) {
      case "top":
        midpoint.y -= offset;
        break;
      case "bottom":
        midpoint.y += offset;
        break;
      case "left":
        midpoint.x -= offset;
        break;
      case "right":
        midpoint.x += offset;
        break;
    }
    return world.toLocal(midpoint, sprite);
  }

  // pseudo-random number generator
  // https://stackoverflow.com/a/47593316
  static splitMix32(a: number) {
    return () => {
      a |= 0;
      a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
  }

  static shuffle(objects: any[], random: () => number) {
    for (let i = objects.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [objects[i], objects[j]] = [objects[j], objects[i]];
    }
  }
}



