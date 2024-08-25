import {JigsawPieceManager} from "./jigsaw-piece-manager";
import {PeerCursor} from "./peer-cursor";
import {Peer} from "../../services/peer-manager/peer";

export interface Player {
  peer: Peer;
  cursor: PeerCursor;
}

export class PlayerManager {
  private players: Map<string, Player>;

  constructor(private manager: JigsawPieceManager) {
    this.players = new Map();
  }

  public addPlayer(peer: Peer) {
    const cursor = this.createCursor(peer);
    this.players.set(peer.id, {peer: peer, cursor: cursor});
  }

  private createCursor(peer: Peer): PeerCursor {
    const cursor = new PeerCursor();
    cursor.handle(peer, this.manager);
    this.manager.worldContainer.addChild(cursor);
    return cursor;
  }
}
