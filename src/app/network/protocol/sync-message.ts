import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export interface SyncPiece {
  id: number;
  x: number;
  y: number;
  pivotX: number;
  pivotY: number;
}

export interface SyncContainer {
  x: number;
  y: number;
  pivotX: number;
  pivotY: number;
  pieceIds: number[];
}

export class SyncMessage implements IMessage {
  public pieces: SyncPiece[];
  public containers: SyncContainer[];

  constructor(pieces: SyncPiece[] = [], containers: SyncContainer[] = []) {
    this.pieces = pieces;
    this.containers = containers;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.Sync);
    encoder.encodeUint16(this.pieces.length);
    for (let piece of this.pieces) {
      encoder.encodeUint16(piece.id);
      encoder.encodeFloat32(piece.x);
      encoder.encodeFloat32(piece.y);
      encoder.encodeFloat32(piece.pivotX);
      encoder.encodeFloat32(piece.pivotY);
    }
    encoder.encodeUint16(this.containers.length);
    for (let container of this.containers) {
      encoder.encodeFloat32(container.x);
      encoder.encodeFloat32(container.y);
      encoder.encodeFloat32(container.pivotX);
      encoder.encodeFloat32(container.pivotY);
      encoder.encodeUint16(container.pieceIds.length);
      for (let piece of container.pieceIds) {
        encoder.encodeUint16(piece);
      }
    }
  }

  decode(decoder: MessageDecoder): void {
    const piecesLength = decoder.decodeUint16();
    this.pieces = new Array(piecesLength);
    for (let i = 0; i < piecesLength; i++) {
      const piece: SyncPiece = {
        id: decoder.decodeUint16(),
        x: decoder.decodeFloat32(),
        y: decoder.decodeFloat32(),
        pivotX: decoder.decodeFloat32(),
        pivotY: decoder.decodeFloat32(),
      }
      this.pieces[i] = piece;
    }
    const containersLength = decoder.decodeUint16();
    this.containers = new Array(containersLength);
    for (let i = 0; i < containersLength; i++) {
      const container: SyncContainer = {
        x: decoder.decodeFloat32(),
        y: decoder.decodeFloat32(),
        pivotX: decoder.decodeFloat32(),
        pivotY: decoder.decodeFloat32(),
        pieceIds: new Array(decoder.decodeUint16())
      }
      for (let j = 0; j < container.pieceIds.length; j++) {
        container.pieceIds[j] = decoder.decodeUint16();
      }
      this.containers[i] = container;
    }
  }
}
