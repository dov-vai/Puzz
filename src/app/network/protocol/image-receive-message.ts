import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class ImageReceiveMessage implements IMessage {
  public name: string;
  public size: number;
  public hash: string;
  public seed?: number;

  constructor(name: string = "", size: number = 0, hash: string = "", seed?: number) {
    this.name = name;
    this.size = size;
    this.hash = hash;
    this.seed = seed;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.ImageReceive);
    encoder.encodeString(this.name);
    encoder.encodeUint32(this.size);
    encoder.encodeString(this.hash);
    if (this.seed != undefined) {
      encoder.encodeUint32(this.seed);
    }
  }

  decode(decoder: MessageDecoder): void {
    this.name = decoder.decodeString();
    this.size = decoder.decodeUint32();
    this.hash = decoder.decodeString();
    if (!decoder.done()) {
      this.seed = decoder.decodeUint32();
    }
  }
}
