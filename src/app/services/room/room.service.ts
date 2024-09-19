import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Host, PublicRoom, Room} from "./types";

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private http: HttpClient) {
  }

  getPublicRooms() {
    return this.http.get<PublicRoom[]>(API_URL + "/public-rooms");
  }

  hostRoom(host: Host) {
    return this.http.post<Room>(API_URL + "/host-game", host);
  }
}
