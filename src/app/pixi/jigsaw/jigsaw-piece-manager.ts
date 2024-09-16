import * as PIXI from "pixi.js";
import {JigsawGenerator} from "./jigsaw-generator";
import {SceneManager} from "../scene-manager";
import {JigsawNeighbour, JigsawPiece} from "./jigsaw-piece";
import {PixiUtils} from "../utils";
import {JigsawEstimator} from "./jigsaw-estimator";

export class JigsawPieceManager {
  private _worldContainer: PIXI.Container;
  private _world!: PIXI.Graphics;
  private _taggedPieces!: JigsawPiece[];
  private _tileWidth!: number;
  private _tileHeight!: number;
  private random: () => number;

  get taggedPieces() {
    return this._taggedPieces;
  }

  get tileWidth() {
    return this._tileWidth;
  }

  get tileHeight() {
    return this._tileHeight;
  }

  get worldContainer() {
    return this._worldContainer;
  }

  get world() {
    return this._world;
  }

  constructor(worldContainer: PIXI.Container) {
    this._worldContainer = worldContainer;
    this.random = Math.random;
  }

  public loadPieces(image: PIXI.Texture, seed: number, pieces: number) {
    this.createWorld(image.width * 4, image.height * 4, 0x424769)
    this.centerWorld();
    this.random = PixiUtils.splitMix32(seed);
    const estimated = JigsawEstimator.estimate(image.width, image.height, pieces, "backwards");
    this._tileWidth = estimated.pieceWidth;
    this._tileHeight = estimated.pieceHeight;
    const generator = new JigsawGenerator(image, this.tileWidth, this.tileHeight, this.random);
    this._taggedPieces = generator.generatePieces(5, 0x000000, SceneManager.appRenderer);
    const worldMidpoint = new PIXI.Point(this.world.width / 2, this.world.height / 2);
    this.placePieces(image, worldMidpoint);
  }

  // TODO: world management should have its own class?
  private createWorld(width: number, height: number, color: PIXI.ColorSource) {
    this._world = new PIXI.Graphics().rect(0, 0, width, height).fill({color: color});
    this.worldContainer.addChild(this._world);
  }

  private centerWorld() {
    this.worldContainer.position.set(-this.world.width / 2, -this.world.height / 2);
  }

  private placePieces(image: PIXI.Texture, position: PIXI.Point) {
    const shuffledPieces = [...this.taggedPieces];
    PixiUtils.shuffle(shuffledPieces, this.random)
    const startPoint = new PIXI.Point(
      position.x - image.width / 2,
      position.y - image.height / 2 - this._tileHeight,
    );
    const offset = Math.max(this.tileWidth, this.tileHeight) / 2;
    const columns = Math.ceil(image.width / this.tileWidth);
    const rows = Math.ceil(image.height / this.tileHeight);
    // recalculate columns and rows needed with piece offset
    const adjColumns = Math.ceil(image.width / (this.tileWidth + offset));
    const adjRows = Math.ceil(image.height / (this.tileHeight + offset));
    const positions = this.rectangularSpiral(columns * rows, Math.max(this.tileWidth, this.tileHeight) + offset, startPoint.x, startPoint.y, adjColumns, adjRows);
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
        target.position.set(neighbourPivot.x, neighbourPivot.y + this.tileHeight);
        break;
      }
      case "bottom": {
        target.position.set(neighbourPivot.x, neighbourPivot.y - this.tileHeight);
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
