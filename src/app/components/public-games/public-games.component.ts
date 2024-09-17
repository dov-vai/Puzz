import {Component, inject, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {RoomService} from "../../services/room/room.service";
import {PublicRoom} from "../../services/room/public-room";

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
export class PublicGamesComponent implements OnInit {
  private roomService = inject(RoomService);
  router = inject(Router);
  publicRooms$!: Observable<PublicRoom[]>;

  ngOnInit(): void {
    this.onRefreshRooms();
  }

  onJoin(roomId: string) {
    this.router.navigate(['play', roomId]);
  }

  onRefreshRooms() {
    this.publicRooms$ = this.roomService.getPublicRooms();
  }
}
