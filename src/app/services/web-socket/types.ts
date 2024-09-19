export enum Types {
  Connected = 'connected',
  Join = 'join',
  Disconnect = 'disconnect',
}

export interface Connected {
  Type: "connected";
  SocketId: string;
  RoomId: string;
}

export interface Join {
  Type: "join";
  RoomId: string;
}

export interface Disconnect {
  Type: "disconnect";
}
