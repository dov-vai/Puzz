export type MessageHandler = (message: any, peer: Peer) => void;
export type CloseHandler = () => void;

export class Peer {
  private _id: string;
  private _isHost: boolean;
  private peer: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private messageHandlers: MessageHandler[];
  private closeHandlers: CloseHandler[]

  get id() {
    return this._id;
  }

  get isHost() {
    return this._isHost;
  }

  set binaryType(type: "arraybuffer" | "blob") {
    this.dataChannel.binaryType = type;
  }

  constructor(id: string, peer: RTCPeerConnection, dataChannel: RTCDataChannel, isHost: boolean) {
    this._id = id;
    this._isHost = isHost;
    this.peer = peer;
    this.dataChannel = dataChannel;
    this.messageHandlers = [];
    this.closeHandlers = [];
    this.dataChannel.onmessage = (event) => {
      this.notifyMessageHandlers(event.data)
    };
    this.dataChannel.onclose = () => {
      this.notifyCloseHandlers()
    };
  }

  private notifyMessageHandlers(message: any) {
    this.messageHandlers.forEach(handle => {
      handle(message, this);
    })
  }

  private notifyCloseHandlers() {
    this.closeHandlers.forEach(handle => {
      handle();
    })
    this.unregisterAll();
  }

  public registerMessageHandler(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  public registerCloseHandler(handler: CloseHandler) {
    this.closeHandlers.push(handler);
  }

  public sendMessage(message: any) {
    if (this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    }
  }

  public unregisterAll() {
    this.messageHandlers = [];
    this.closeHandlers = [];
  }

  public close() {
    this.closePeer();
    this.closeChannel();
  }

  public closePeer() {
    this.peer.close();
  }

  public closeChannel() {
    this.dataChannel.close()
  }
}
