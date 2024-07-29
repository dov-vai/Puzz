import * as PIXI from 'pixi.js';

export class PixiUtils {
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

}



