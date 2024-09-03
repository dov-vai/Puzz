import {Injectable} from '@angular/core';
import {WebSocketService} from "../web-socket/web-socket.service";
import {Subscription, tap} from "rxjs";
import {Peer} from "./peer";
import {P2PInit, ReceiveInit, RemovePeer, SendInit, Signal, Types} from "./types";

class ManagedPeer {
  peer: RTCPeerConnection;
  dataChannel?: RTCDataChannel;

  constructor(peer: RTCPeerConnection, channel?: RTCDataChannel) {
    this.peer = peer;
    this.dataChannel = channel;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PeerManagerService {
  private peers!: Map<string, ManagedPeer>;
  private myId!: string;
  private subscription!: Subscription;
  private hostId!: string;

  onDataChannelOpen: (peer: Peer) => void = () => {
  };

  constructor(private socket: WebSocketService) {
  }

  public async init() {
    this.peers = new Map<string, ManagedPeer>();
    this.myId = "";
    this.hostId = "";
    this.subscription = this.socket.messages$.pipe(
      tap({
        error: error => console.log("[PeerManager] failed connecting to WebSocket", error)
      })
    ).subscribe(async (message) => {
      await this.handleMessage(message)
    });
    this.socket.connect();
    this.socket.sendMessage({Type: "p2pInit"});
  }

  public destroy() {
    if (!this.peers){
      return;
    }

    for (const [key, peer] of this.peers) {
      peer.peer.close();
      this.peers.delete(key);
    }

    if (!this.subscription.closed) {
      this.subscription.unsubscribe();
    }
  }

  private async handleMessage(data: any) {
    switch (data.Type) {
      case Types.P2PInit: {
        this.handleP2pInit(data);
        break;
      }
      case Types.ReceiveInit: {
        await this.handleReceiveInit(data);
        break;
      }
      case Types.SendInit: {
        await this.handleSendInit(data);
        break;
      }
      case Types.Signal: {
        await this.handleSignal(data);
        break;
      }
      case Types.RemovePeer: {
        this.handleRemovePeer(data);
        break;
      }
    }
  }

  private handleRemovePeer(data: RemovePeer) {
    const socketId = data.SocketId;
    this.removePeer(socketId);
  }

  private async handleSignal(data: Signal) {
    let id = data.SocketId;
    let signalData = JSON.parse(data.Signal);
    let peer = this.peers.get(id)?.peer;
    if (peer) {
      if (signalData.sdp) {
        await peer.setRemoteDescription(new RTCSessionDescription(signalData));
        if (signalData.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          const signal: Signal = {
            Type: "signal",
            Signal: JSON.stringify(peer.localDescription),
            SocketId: id
          };
          this.socket.sendMessage(signal);
        }
      } else if (signalData.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(signalData));
      }
    }
  }

  private async handleSendInit(data: SendInit) {
    const socketId = data.SocketId;
    await this.addPeer(socketId, true);
  }

  private async handleReceiveInit(data: ReceiveInit) {
    const socketId = data.SocketId;
    await this.addPeer(socketId, false);
    const sendInit: SendInit = {Type: "sendInit", SocketId: socketId};
    this.socket.sendMessage(sendInit);
  }

  private handleP2pInit(data: P2PInit) {
    this.myId = data.SocketId;
    this.hostId = data.HostId;
    console.log("my socketid is:", this.myId);
  }

  private async addPeer(id: string, initiator: boolean) {
    let peer = new RTCPeerConnection({
      iceServers: [
        {urls: 'stun:stun.l.google.com:19302'}
      ]
    });

    this.peers.set(id, new ManagedPeer(peer))

    if (initiator) {
      const dataChannel = peer.createDataChannel("dataChannel");
      this.setupDataChannel(id, dataChannel);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const signal: Signal = {Type: "signal", Signal: JSON.stringify(peer.localDescription), SocketId: id};
      this.socket.sendMessage(signal);
    } else {
      peer.ondatachannel = (event) => {
        this.setupDataChannel(id, event.channel);
      };
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        const signal: Signal = {Type: "signal", Signal: JSON.stringify(event.candidate), SocketId: id};
        this.socket.sendMessage(signal);
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        //
      }
    };
  }

  private setupDataChannel(id: string, dataChannel: RTCDataChannel) {
    const peer = this.peers.get(id)!;
    const isHost = id === this.hostId;
    dataChannel.onopen = () => {
      const connectedPeer = new Peer(id, peer.peer, dataChannel, isHost);
      this.onDataChannelOpen(connectedPeer);
    };
    // should be initialized before the whole function is called
    peer.dataChannel = dataChannel;
  }

  removePeer(id: string) {
    const peer = this.peers.get(id);
    if (peer) {
      peer.peer.close();
      this.peers.delete(id);
    }
  }

  broadcastMessage(message: string | ArrayBuffer) {
    for (let peer of this.peers.values()) {
      if (peer.dataChannel && peer.dataChannel.readyState === "open") {
        if (typeof message === "string") {
          peer.dataChannel.send(message);
        } else {
          peer.dataChannel.send(message);
        }
      }
    }
  }

  sendMessage(id: string, message: string | ArrayBuffer) {
    if (typeof message === "string") {
      this.peers.get(id)?.dataChannel?.send(message);
    } else if (message instanceof ArrayBuffer) {
      this.peers.get(id)?.dataChannel?.send(message);
    }
  }
}
