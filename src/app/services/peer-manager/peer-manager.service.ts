import {Injectable} from '@angular/core';
import {WebSocketService} from "../web-socket/web-socket.service";
import {tap} from "rxjs";

class Peer {
  peer: RTCPeerConnection;
  dataChannel!: RTCDataChannel;

  constructor(peer: RTCPeerConnection) {
    this.peer = peer;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PeerManagerService {
  private peers = new Map<string, Peer>();
  private myId: string = "";
  onDataChannelOpen: (channel: RTCDataChannel) => void = () => {
  };

  constructor(private socket: WebSocketService) {
    this.socket.messages$.pipe(
      tap({
        error: error => console.log("[PeerManager] failed connecting to WebSocket", error)
      })
    ).subscribe(async (message) => {
      await this.handleMessage(message)
    });
    this.socket.connect();
  }

  private async handleMessage(data: any) {
    switch (data.Type) {
      case "connected": {
        this.myId = data.SocketId;
        console.log("my socketid is:", this.myId);
        break;
      }
      case "receiveInit": {
        let socketId = data.SocketId;
        await this.addPeer(socketId, false);
        this.socket.sendMessage({Type: "sendInit", SocketId: socketId});
        break;
      }
      case "sendInit": {
        let socketId = data.SocketId;
        await this.addPeer(socketId, true);
        break;
      }
      case "signal": {
        let id = data.SocketId;
        let signalData = JSON.parse(data.Signal);
        let peer = this.peers.get(id)?.peer;
        if (peer) {
          if (signalData.sdp) {
            await peer.setRemoteDescription(new RTCSessionDescription(signalData));
            if (signalData.type === "offer") {
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              let signal = {
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
        break;
      }
      case "removePeer": {
        let socketId = data.SocketId;
        this.removePeer(socketId);
        break;
      }
    }
  }

  private async addPeer(id: string, initiator: boolean) {
    let peer = new RTCPeerConnection({
      iceServers: [
        {urls: 'stun:stun.l.google.com:19302'}
      ]
    });

    this.peers.set(id, new Peer(peer))

    if (initiator) {
      const dataChannel = peer.createDataChannel("dataChannel");
      this.setupDataChannel(id, dataChannel);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      let signal = {Type: "signal", Signal: JSON.stringify(peer.localDescription), SocketId: id};
      this.socket.sendMessage(signal);
    } else {
      peer.ondatachannel = (event) => {
        this.setupDataChannel(id, event.channel);
      };
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        let signal = {Type: "signal", Signal: JSON.stringify(event.candidate), SocketId: id};
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
    dataChannel.onopen = () => {
      this.onDataChannelOpen(dataChannel)
    };
    // should be initialized before the whole function is called
    this.peers.get(id)!.dataChannel = dataChannel;
  }

  removePeer(id: string) {
    const peer = this.peers.get(id);
    if (peer) {
      peer.peer.close();
      this.peers.delete(id);
    }
  }

  brodcastMessage(message: string) {
    for (let peer of this.peers.values()) {
      if (peer.dataChannel.readyState == "open") {
        peer.dataChannel.send(message);
      }
    }
  }
}
