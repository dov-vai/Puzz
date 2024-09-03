import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {Observable, Subject, Subscription} from "rxjs";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {Join, PublicRoom, PublicRooms, Types} from "../../services/web-socket/types";

@Component({
  selector: 'app-public-games',
  standalone: true,
  imports: [
    AsyncPipe,
    NgForOf,
    NgIf
  ],
  templateUrl: './public-games.component.html',
  styleUrl: './public-games.component.css'
})
export class PublicGamesComponent implements OnInit, OnDestroy {
  websocket = inject(WebSocketService);
  router = inject(Router);
  subscription!: Subscription;
  publicRoomsSubject$: Subject<PublicRoom[]> = new Subject<PublicRoom[]>();
  publicRooms$: Observable<PublicRoom[]> = this.publicRoomsSubject$.asObservable();

  ngOnInit(): void {
    this.subscription = this.websocket.messages$.subscribe(this.onMessage.bind(this));
    this.websocket.connect();
    this.onRefreshRooms();
  }

  onMessage(message: any) {
    switch (message.Type) {
      case Types.PublicRooms: {
        this.publicRoomsSubject$.next(message.Rooms as PublicRoom[]);
        break;
      }
      case Types.Connected: {
        console.log("connected successfully SocketId: ", message.SocketId);
        this.router.navigate(['play', message.RoomId]);
        break;
      }
      default: {
        break;
      }
    }
  }

  onJoin(roomId: string) {
    const join: Join = {Type: "join", RoomId: roomId};
    this.websocket.sendMessage(join);
  }

  onRefreshRooms() {
    const publicRooms: PublicRooms = {Type: "publicRooms"};
    this.websocket.sendMessage(publicRooms);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
