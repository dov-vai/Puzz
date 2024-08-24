import * as PIXI from "pixi.js";
import {JigsawGenerator} from "./jigsaw-generator";
import {SceneManager} from "../scene-manager";
import {JigsawNeighbour, JigsawPiece} from "./jigsaw-piece";

export class JigsawPieceManager {
  private _worldContainer: PIXI.Container;
  private _world: PIXI.Graphics;
  private _taggedPieces!: JigsawPiece[];
  private _tileWidth!: number;

  get taggedPieces() {
    return this._taggedPieces;
  }

  get tileWidth() {
    return this._tileWidth;
  }

  get worldContainer() {
    return this._worldContainer;
  }

  get world() {
    return this._world;
  }

  constructor(worldContainer: PIXI.Container, world: PIXI.Graphics) {
    this._worldContainer = worldContainer;
    this._world = world;
  }

  public loadPieces(image: PIXI.Texture, seed: number) {
    this._tileWidth = 100;
    const generator = new JigsawGenerator(image, this.tileWidth, seed);
    this._taggedPieces = generator.generatePieces(5, 0x000000, SceneManager.appRenderer);
    const worldMidpoint = new PIXI.Point(this.world.width / 2, this.world.height / 2);
    this.placePieces(image, worldMidpoint);
  }

  private placePieces(image: PIXI.Texture, position: PIXI.Point) {
    const shuffledPieces = [...this.taggedPieces];
    this.shuffle(shuffledPieces);
    const startPoint = new PIXI.Point(
      position.x - image.width,
      position.y - image.height,
    );
    const columns = Math.ceil(image.width / this.tileWidth);
    const rows = Math.ceil(image.height / this.tileWidth);
    const positions = this.rectangularSpiral(columns * rows, this.tileWidth + 50, startPoint.x, startPoint.y, columns, rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const id = y * columns + x;
        const piece = shuffledPieces[id];
        const position = positions[id];
        piece.resetPivot();
        piece.position.set(position.x, position.y);
        this.worldContainer.addChild(piece);
      }
    }
  }

  private rectangularSpiral(
    numObjects: number,
    stepSize: number,
    x: number = 0,
    y: number = 0,
    stepsX: number = 1,
    stepsY: number = 1
  ) {
    let positions = [];

    let directions = [
      {x: stepSize, y: 0},  // Right
      {x: 0, y: stepSize},  // Down
      {x: -stepSize, y: 0}, // Left
      {x: 0, y: -stepSize} // Up
    ];

    let directionIndex = 0;
    let steps = stepsX;
    while (positions.length < numObjects) {
      for (let i = 0; i < steps; i++) {
        if (positions.length >= numObjects) break;
        positions.push({x: x, y: y});
        x += directions[directionIndex].x;
        y += directions[directionIndex].y;
      }

      steps = directionIndex % 2 === 0 ? stepsY : stepsX;

      directionIndex = (directionIndex + 1) % 4;

      if (directionIndex % 2 === 0) {
        stepsX++;
        stepsY++;
        steps++;
      }
    }

    return positions;
  }

  private shuffle(pieces: JigsawPiece[]) {
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
  }

  public handlePieceSnap(piece: JigsawPiece, jigsawNeighbour: JigsawNeighbour) {
    const neighbour = this.taggedPieces[jigsawNeighbour.id];
    const pieceInContainer = piece.parent != this.worldContainer;
    if (pieceInContainer && piece.parent === neighbour.parent) {
      return;
    }

    let target: PIXI.Sprite | PIXI.Container = piece;

    if (pieceInContainer) {
      const pos = piece.parent?.toLocal(piece.alignmentPivot, piece);
      piece.parent?.pivot.copyFrom(pos);
      piece.parent.position.copyFrom(pos);
      target = piece.parent;
    } else {
      piece.resetPivot();
    }

    const neighbourPivot = this.world.toLocal(neighbour.alignmentPivot, neighbour);

    switch (jigsawNeighbour.direction) {
      case "top": {
        target.position.set(neighbourPivot.x, neighbourPivot.y + this.tileWidth);
        break;
      }
      case "bottom": {
        target.position.set(neighbourPivot.x, neighbourPivot.y - this.tileWidth);
        break;
      }
      case "left": {
        target.position.set(neighbourPivot.x + this.tileWidth, neighbourPivot.y);
        break;
      }
      case "right": {
        target.position.set(neighbourPivot.x - this.tileWidth, neighbourPivot.y);
        break;
      }
    }

    this.handleContainerSnap(piece, neighbour);
  }

  private handleContainerSnap(piece: JigsawPiece, neighbour: JigsawPiece) {
    const pieceInContainer = piece.parent != this.worldContainer;
    const neighbourInContainer = neighbour.parent != this.worldContainer

    if (!pieceInContainer && !neighbourInContainer) {
      const container = new PIXI.Container({isRenderGroup: true});
      container.addChild(neighbour, piece);
      this.worldContainer.removeChild(neighbour, piece);
      // set container position and pivot because on creation it's (0,0)
      // which causes issues when syncing clients
      container.pivot.copyFrom(piece);
      container.position.copyFrom(piece);
      this.worldContainer.addChild(container);
    } else if (!pieceInContainer && neighbourInContainer) {
      const piecePos = neighbour.parent?.toLocal(piece.position, this.world);
      neighbour.parent.addChild(piece);
      this.worldContainer.removeChild(piece);
      piece.position.copyFrom(piecePos);
    } else if (pieceInContainer && !neighbourInContainer) {
      const neighbourPos = piece.parent?.toLocal(neighbour.position, this.world);
      piece.parent?.addChild(neighbour);
      this.worldContainer.removeChild(neighbour);
      neighbour.position.copyFrom(neighbourPos);
    } else {
      const container = piece.parent;
      const children = [...container?.children];
      for (let child of children) {
        let piecePos = neighbour.parent?.toLocal(this.world.toLocal(child, child.parent), this.world);
        neighbour.parent.addChild(child);
        child.position.copyFrom(piecePos);
      }
      container?.removeFromParent();
    }
  }
}
