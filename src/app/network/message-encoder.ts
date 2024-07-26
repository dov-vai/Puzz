export class MessageEncoder {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset: number;

  constructor(size: number) {
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
    this.offset = 0;
  }

  public encodeUint8(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  public encodeUint16(value: number) {
    this.view.setUint16(this.offset, value);
    this.offset += 2;
  }

  public encodeUint32(value: number) {
    this.view.setUint32(this.offset, value);
    this.offset += 4;
  }

  public encodeFloat32(value: number) {
    this.view.setFloat32(this.offset, value);
    this.offset += 4;
  }

  public getBuffer(): ArrayBuffer {
    return this.buffer;
  }
}
