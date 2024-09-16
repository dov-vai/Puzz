import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {GameService} from "../../services/game/game.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {NgIf} from "@angular/common";
import {Subscription} from "rxjs";
import {Disconnect, Join, Types} from "../../services/web-socket/types";

export interface GameExtras {
  image?: File;
  pieces?: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements AfterViewInit, OnDestroy {
  game = inject(GameService);
  ngZone = inject(NgZone);
  websocket = inject(WebSocketService);
  activatedRoute = inject(ActivatedRoute);
  subscription?: Subscription;
  extras?: GameExtras;
  showImage: boolean = false;
  showPopup: boolean = true;
  imageUri?: string;
  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router) {
    this.extras = this.router.getCurrentNavigation()?.extras.state as GameExtras;
  }

  ngAfterViewInit(): void {
    if (this.extras) {
      this.startGame();
      return;
    }

    const roomId = this.activatedRoute.snapshot.paramMap.get("id");

    if (!roomId) {
      return;
    }

    this.subscription = this.websocket.messages$.subscribe(this.onMessage.bind(this));
    this.websocket.connect();
    const join: Join = {RoomId: roomId, Type: "join"};
    this.websocket.sendMessage(join);
  }

  startGame() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement, this.extras?.image, this.extras?.pieces);
      })();
    });
  }

  onMessage(message: any) {
    switch (message.Type) {
      case Types.Connected: {
        this.startGame();
        break;
      }
      default: {
        break;
      }
    }
  }

  onBack() {
    const disconnect: Disconnect = {Type: "disconnect"}
    this.websocket.sendMessage(disconnect);
  }

  previewImage() {
    if (!this.imageUri) {
      this.imageUri = this.game.getImageUri();
    }

    if (this.imageUri) {
      this.showImage = !this.showImage;
    }
  }

  closePopup() {
    this.showPopup = false;
  }

  ngOnDestroy() {
    this.game.destroy();
    this.subscription?.unsubscribe();
  }
}
