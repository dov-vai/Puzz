export class Peer {
  private _id: string;
  private peer: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private _onMessage: (message: any) => void;
  private _onClose: () => void;

  get id() {
    return this._id;
  }

  set onMessage(onMessage: (message: any) => void) {
    this._onMessage = onMessage;
    this.dataChannel.onmessage = (event) => {
      this._onMessage(event.data);
    };
  }

  set onClose(onClose: () => void) {
    this._onClose = onClose;
    this.dataChannel.onclose = () => {
      this._onClose();
    };
  }

  set binaryType(type: "arraybuffer" | "blob") {
    this.dataChannel.binaryType = type;
  }

  constructor(id: string, peer: RTCPeerConnection, dataChannel: RTCDataChannel) {
    this._id = id;
    this.peer = peer;
    this.dataChannel = dataChannel;
    this._onMessage = () => {
    };
    this._onClose = () => {
    };
  }

  public sendMessage(message: any) {
    if (this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    }
  }

  public closePeer() {
    this.peer.close();
  }

  public closeChannel() {
    this.dataChannel.close()
  }
}
