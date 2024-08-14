import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class SnapMessage implements IMessage {
  public pieceId: number;
  public neighbourId: number;

  constructor(pieceId = 0, snappedTo: number = 0) {
    this.pieceId = pieceId;
    this.neighbourId = snappedTo;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.Snap);
    encoder.encodeUint16(this.pieceId);
    encoder.encodeUint16(this.neighbourId);
  }

  decode(decoder: MessageDecoder): void {
    this.pieceId = decoder.decodeUint16();
    this.neighbourId = decoder.decodeUint16();
  }


}
