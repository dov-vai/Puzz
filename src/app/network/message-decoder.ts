export class MessageDecoder {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  public decodeUint8() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  public decodeUint16() {
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }

  public decodeUint32() {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  public decodeFloat32() {
    const value = this.view.getFloat32(this.offset);
    this.offset += 4;
    return value;
  }

  public decodeString(): string {
    let value = "";
    while (true) {
      const char = this.view.getUint8(this.offset++);
      if (char === 0) break; // end of string
      value += String.fromCharCode(char);
    }
    return value;
  }

  public done() {
    return this.view.byteLength === this.offset;
  }

  public getLength() {
    return this.view.byteLength;
  }
}
