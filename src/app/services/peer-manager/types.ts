export enum Types {
  Signal = 'signal',
  SendInit = 'sendInit',
  ReceiveInit = 'receiveInit',
  P2PInit = 'p2pInit',
  RemovePeer = 'removePeer',
}

export interface Signal {
  Type: "signal";
  Signal: string;
  SocketId: string;
}

export interface SendInit {
  Type: "sendInit";
  SocketId: string;
}

export interface ReceiveInit {
  Type: "receiveInit";
  SocketId: string;
}

export interface P2PInit {
  Type: "p2pInit";
  SocketId: string;
  RoomId: string;
  Host: boolean;
}

export interface RemovePeer {
  Type: "removePeer";
  SocketId: string;
}
