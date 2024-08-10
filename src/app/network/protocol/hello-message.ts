import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class HelloMessage implements IMessage {
  public peerId: string;

  constructor(peerId: string = "") {
    this.peerId = peerId;
  }

  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.Hello);
    encoder.encodeString(this.peerId);
  }

  decode(decoder: MessageDecoder): void {
    this.peerId = decoder.decodeString();
  }
}
