export enum Types {
  Connected = 'connected',
  Join = 'join',
  Host = 'host',
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

export interface Host {
  Type: "host";
  Title: string;
  Pieces: number;
  Public: boolean;
}

export interface Disconnect {
  Type: "disconnect";
}
