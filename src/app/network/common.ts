export enum MessageType {
  Cursor = 0x1,
  ImageReceive = 0x2,
  ImageChunk = 0x3,
  ImageRequest = 0x4,
  Snap = 0x5,
  Sync = 0x6,
  SyncRequest = 0x7,
}
