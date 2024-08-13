import {MessageDecoder} from "../message-decoder";
import {MessageEncoder} from "../message-encoder";
import {IMessage} from "./i-message";
import {MessageType} from "../common";

export class ImageRequestMessage implements IMessage {
  encode(encoder: MessageEncoder): void {
    encoder.encodeUint8(MessageType.ImageRequest);
  }

  decode(decoder: MessageDecoder): void {
  }
}
