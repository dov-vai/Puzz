import * as PIXI from "pixi.js";
import {Peer} from "../../services/peer-manager/peer";
import {MessageEncoder} from "../../network/message-encoder";
import {ImageReceiveMessage} from "../../network/protocol/image-receive-message";
import {ImageChunkMessage} from "../../network/protocol/image-chunk-message";
import {MessageDecoder} from "../../network/message-decoder";
import {ImageRequestMessage} from "../../network/protocol/image-request-message";
import {MessageType} from "../../network/common";

export interface JigsawImage {
  image: PIXI.Texture;
  seed: number;
}

export class ImageLoader {
  private image?: PIXI.Texture;
  private seed?: number;
  private imageBuffer!: Uint8Array;
  private bufferOffset!: number;
  private resolveImage: (image: JigsawImage) => void = () => {
  };

  public async loadImage(uri: string): Promise<JigsawImage> {
    const image = await PIXI.Assets.load(uri);
    this.image = image;
    const seed = (Math.random() * 2 ** 32) >>> 0;
    return {image, seed};
  }

  public handle(message: any, peer: Peer) {
    if (peer) {
      console.log(peer);
    }

    if (message instanceof ArrayBuffer) {
      const decoder = new MessageDecoder(message);
      const type = decoder.decodeUint8();
      switch (type) {
        case MessageType.ImageChunk: {
          this.handleImageChunkMessage(decoder, peer);
          break;
        }
        case MessageType.ImageReceive: {
          this.handleImageReceiveMessage(decoder);
          break;
        }
        case MessageType.ImageRequest: {
          this.handleImageRequestMessage(peer);
          break;
        }
      }
    }
  }

  public async requestImage(host: Peer): Promise<JigsawImage> {
    return new Promise((resolve, reject) => {
      const encoder = new MessageEncoder();
      const imageRequest = new ImageRequestMessage();
      imageRequest.encode(encoder);
      host.sendMessage(encoder.getBuffer());
      this.resolveImage = resolve;
    });
  }

  private handleImageReceiveMessage(decoder: MessageDecoder) {
    const imageReceive = new ImageReceiveMessage();
    imageReceive.decode(decoder);
    this.imageBuffer = new Uint8Array(imageReceive.size);
    this.bufferOffset = 0;
    if (imageReceive.seed != undefined) {
      this.seed = imageReceive.seed;
    }
  }

  private handleImageRequestMessage(peer: Peer) {
    const encoder = new MessageEncoder();
    const buffer = this.convertStringToBinary(this.image?.source._sourceOrigin!);
    const imageReceive = new ImageReceiveMessage("image", buffer.byteLength, "", this.seed);
    imageReceive.encode(encoder);
    peer.sendMessage(encoder.getBuffer());

    // TODO: expensive operation, should be async
    const chunkSize = 15 * 1024;
    let size = 0;
    while (size < buffer.byteLength) {
      const encoder = new MessageEncoder();
      const end = Math.min(chunkSize, buffer.byteLength - size);
      const fileChunk = new ImageChunkMessage(buffer.slice(size, size + end), end);
      fileChunk.encode(encoder);
      peer.sendMessage(encoder.getBuffer());
      size += end;
    }
  }

  private handleImageChunkMessage(decoder: MessageDecoder, peer: Peer) {
    const imageChunk = new ImageChunkMessage();
    imageChunk.decode(decoder);
    this.imageBuffer.set(new Uint8Array(imageChunk.buffer!), this.bufferOffset);
    this.bufferOffset += imageChunk.buffer!.byteLength;

    if (this.bufferOffset === this.imageBuffer.length) {
      this.completeImageReceive();
    }
  }

  private completeImageReceive() {
    const decoder = new MessageDecoder(this.imageBuffer.buffer);
    PIXI.Assets.load(decoder.decodeString(this.bufferOffset)).then((texture: PIXI.Texture) => {
      this.resolveImage({image: texture, seed: this.seed!});
    })
  }

  private convertStringToBinary(value: string) {
    const encoder = new MessageEncoder();
    encoder.encodeString(value, value.length);
    return encoder.getBuffer();
  }
}
