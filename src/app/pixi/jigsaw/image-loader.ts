import * as PIXI from "pixi.js";
import {Peer} from "../../services/peer-manager/peer";
import {MessageEncoder} from "../../network/message-encoder";
import {ImageReceiveMessage} from "../../network/protocol/image-receive-message";
import {ImageChunkMessage} from "../../network/protocol/image-chunk-message";
import {MessageDecoder} from "../../network/message-decoder";
import {ImageRequestMessage} from "../../network/protocol/image-request-message";
import {MessageType} from "../../network/common";

export interface JigsawImage {
  texture: PIXI.Texture;
  seed: number;
  pieces: number;
}

export class ImageLoader {
  private image?: File;
  private texture?: PIXI.Texture;
  private seed?: number;
  private pieces?: number;
  private _uri?: string;
  private imageBuffer!: Uint8Array;
  private bufferOffset!: number;
  private mimeType!: string;
  private resolveImage: (image: JigsawImage) => void = () => {
  };

  get uri() {
    return this._uri;
  }

  public async loadImage(image: File, pieces: number): Promise<JigsawImage> {
    this.image = image;
    this._uri = URL.createObjectURL(image);
    const texture = await PIXI.Assets.load({
      src: this._uri,
      format: "png",
      loadParser: "loadTextures"
    });
    this.texture = texture;
    const seed = (Math.random() * 2 ** 32) >>> 0;
    this.seed = seed;
    this.pieces = pieces;
    return {texture, seed, pieces};
  }

  public handle(message: any, peer: Peer) {
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
    this.mimeType = imageReceive.mimeType;
    this.seed = imageReceive.seed;
    this.pieces = imageReceive.pieces;
  }

  private handleImageRequestMessage(peer: Peer) {
    this.image?.arrayBuffer().then(buffer => {
      const encoder = new MessageEncoder();
      const imageReceive = new ImageReceiveMessage("image", this.image?.type, buffer.byteLength, "", this.seed, this.pieces);
      imageReceive.encode(encoder);
      peer.sendMessage(encoder.getBuffer());

      // TODO: expensive operation, should be async
      // webrtc ordered data channel limit is 16KiB, so we subtract what's taken up by the message type + size (5 bytes)
      const chunkSize = 16 * 1024 - 5;
      let size = 0;
      while (size < buffer.byteLength) {
        const encoder = new MessageEncoder();
        const end = Math.min(chunkSize, buffer.byteLength - size);
        const fileChunk = new ImageChunkMessage(buffer.slice(size, size + end), end);
        fileChunk.encode(encoder);
        peer.sendMessage(encoder.getBuffer());
        size += end;
      }
    })
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
    const blob = new Blob([this.imageBuffer.buffer], {type: this.mimeType});
    this._uri = URL.createObjectURL(blob);
    PIXI.Assets.load({
      src: this._uri,
      type: "png",
      loadParser: "loadTextures"
    }).then((texture: PIXI.Texture) => {
      this.texture = texture;
      this.resolveImage({texture: texture, seed: this.seed!, pieces: this.pieces!});
    })
  }
}
