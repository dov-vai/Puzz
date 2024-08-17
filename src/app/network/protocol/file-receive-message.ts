import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class FileReceiveMessage implements IMessage {
  public name: string;
  public size: number;
  public hash: string;
  public extra?: number;

  constructor(name: string = "", size: number = 0, hash: string = "", extra?: number) {
    this.name = name;
    this.size = size;
    this.hash = hash;
    this.extra = extra;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.FileReceive);
    encoder.encodeString(this.name);
    encoder.encodeUint32(this.size);
    encoder.encodeString(this.hash);
    if (this.extra != undefined) {
      encoder.encodeUint32(this.extra);
    }
  }

  decode(decoder: MessageDecoder): void {
    this.name = decoder.decodeString();
    this.size = decoder.decodeUint32();
    this.hash = decoder.decodeString();
    if (!decoder.done()) {
      this.extra = decoder.decodeUint32();
    }
  }
}
