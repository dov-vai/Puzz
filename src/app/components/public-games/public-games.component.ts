import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {Observable, Subject, Subscription} from "rxjs";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";

interface PublicRoom {
  Id: string,
  Title: string,
  PlayerCount: number
}

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
  subscription!: Subscription;
  publicRoomsSubject$: Subject<PublicRoom[]> = new Subject<PublicRoom[]>();
  publicRooms$: Observable<PublicRoom[]> = this.publicRoomsSubject$.asObservable();

  ngOnInit(): void {
    this.subscription = this.websocket.messages$.subscribe(this.onMessage.bind(this));
    this.websocket.connect();
    this.websocket.sendMessage({Type: "publicRooms"})
  }

  onMessage(message: any) {
    switch (message.Type) {
      case "publicRooms": {
        this.publicRoomsSubject$.next(message.Rooms as PublicRoom[]);
        break;
      }
      default: {
        break;
      }
    }
  }

  onJoin(roomId: string) {
    this.websocket.sendMessage({Type: "join", RoomId: roomId});
  }

  onRefreshRooms() {
    this.websocket.sendMessage({Type: "publicRooms"})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
