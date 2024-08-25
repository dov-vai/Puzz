import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export interface PickedPiece {
  id: number;
  pivotX: number;
  pivotY: number;
}

export class CursorMessage implements IMessage {
  public x: number;
  public y: number;
  public piece?: PickedPiece

  constructor(x: number = 0, y: number = 0, piece?: PickedPiece) {
    this.x = x;
    this.y = y;
    this.piece = piece;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.Cursor);
    encoder.encodeFloat32(this.x);
    encoder.encodeFloat32(this.y);
    if (this.piece != undefined) {
      encoder.encodeUint16(this.piece.id);
      encoder.encodeFloat32(this.piece.pivotX);
      encoder.encodeFloat32(this.piece.pivotY);
    }
  }

  decode(decoder: MessageDecoder): void {
    this.x = decoder.decodeFloat32();
    this.y = decoder.decodeFloat32();
    if (!decoder.done()) {
      this.piece = {
        id: decoder.decodeUint16(),
        pivotX: decoder.decodeFloat32(),
        pivotY: decoder.decodeFloat32(),
      }
    }
  }

  verify(decoder: MessageDecoder) {
    const length = decoder.getLength();
    // with piece picked up or not
    return length === 9 || length === 19;
  }

}
