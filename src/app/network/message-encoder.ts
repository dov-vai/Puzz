export class MessageEncoder {
  private buffer: Uint8Array;
  private offset: number;

  constructor(size: number = 1024) {
    this.buffer = new Uint8Array(size);
    this.offset = 0;
  }

  private ensureCapacity(size: number) {
    const requiredSize = this.offset + size;
    if (requiredSize > this.buffer.length) {
      const newSize = Math.max(this.buffer.length * 2, requiredSize);
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  public encodeUint8(value: number) {
    this.ensureCapacity(1);
    const view = new DataView(this.buffer.buffer, this.offset, 1);
    view.setUint8(0, value);
    this.offset += 1;
  }

  public encodeUint16(value: number) {
    this.ensureCapacity(2);
    const view = new DataView(this.buffer.buffer, this.offset, 2);
    view.setUint16(0, value);
    this.offset += 2;
  }

  public encodeUint32(value: number) {
    this.ensureCapacity(4);
    const view = new DataView(this.buffer.buffer, this.offset, 4);
    view.setUint32(0, value);
    this.offset += 4;
  }

  public encodeFloat32(value: number) {
    this.ensureCapacity(4);
    const view = new DataView(this.buffer.buffer, this.offset, 4);
    view.setFloat32(0, value);
    this.offset += 4;
  }

  public getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }
}
