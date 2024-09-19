export interface PublicRoom {
  id: string,
  title: string,
  pieces: number,
  playerCount: number
}

export interface Host {
  Title: string;
  Pieces: number;
  Public: boolean;
}

export interface Room {
  roomId: string;
}
