import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {PublicRoom} from "./public-room";
import {environment} from "../../../environments/environment";

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
}
