import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class FileChunkMessage implements IMessage {
  public buffer?: ArrayBuffer;
  public size: number;

  constructor(buffer?: ArrayBuffer, size: number = 16384) {
    this.buffer = buffer;
    this.size = size;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.FileChunk);
    encoder.encodeUint32(this.size);
    if (this.buffer) {
      encoder.encodeBuffer(this.buffer);
    }
  }

  decode(decoder: MessageDecoder): void {
    this.size = decoder.decodeUint32();
    this.buffer = decoder.decodeBuffer(this.size);
  }

}
