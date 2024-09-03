export enum Types {
  Connected = 'connected',
  PublicRooms = 'publicRooms',
  Join = 'join',
  Host = 'host',
  Disconnect = 'disconnect',
}

export interface Connected {
  Type: "connected";
  SocketId: string;
  RoomId: string;
}

export interface PublicRoom {
  Id: string,
  Title: string,
  Pieces: number,
  PlayerCount: number
}

export interface PublicRooms {
  Type: "publicRooms";
  PublicRooms?: PublicRoom[];
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
