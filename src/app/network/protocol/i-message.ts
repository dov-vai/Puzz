import {MessageEncoder} from "../message-encoder";
import {MessageDecoder} from "../message-decoder";

export interface IMessage {
  encode(encoder: MessageEncoder): void;

  decode(decoder: MessageDecoder): void;
}
