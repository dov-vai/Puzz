import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class ImageReceiveMessage implements IMessage {
  public name: string;
  public mimeType: string;
  public size: number;
  public hash: string;
  public seed: number;
  public pieces: number;

  constructor(name: string = "", mimeType: string = "", size: number = 0, hash: string = "", seed: number = 0, pieces: number = 0) {
    this.name = name;
    this.mimeType = mimeType;
    this.size = size;
    this.hash = hash;
    this.seed = seed;
    this.pieces = pieces;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.ImageReceive);
    encoder.encodeString(this.name);
    encoder.encodeString(this.mimeType);
    encoder.encodeUint32(this.size);
    encoder.encodeString(this.hash);
    encoder.encodeUint32(this.seed);
    encoder.encodeUint16(this.pieces);
  }

  decode(decoder: MessageDecoder): void {
    this.name = decoder.decodeString();
    this.mimeType = decoder.decodeString();
    this.size = decoder.decodeUint32();
    this.hash = decoder.decodeString();
    this.seed = decoder.decodeUint32();
    this.pieces = decoder.decodeUint16();
  }
}
