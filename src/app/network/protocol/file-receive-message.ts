import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class FileReceiveMessage implements IMessage {
  public name: string;
  public size: number;
  public hash: string;

  constructor(name: string = "", size: number = 0, hash: string = "") {
    this.name = name;
    this.size = size;
    this.hash = hash;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.FileReceive);
    encoder.encodeString(this.name);
    encoder.encodeUint32(this.size);
    encoder.encodeString(this.hash);
  }

  decode(decoder: MessageDecoder): void {
    this.name = decoder.decodeString();
    this.size = decoder.decodeUint32();
    this.hash = decoder.decodeString();
  }
}
