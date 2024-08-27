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
import {Router, RouterLink} from "@angular/router";
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {NgIf} from "@angular/common";

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
  extras?: GameExtras;
  showImage: boolean = false;
  imageUri?: string;

  constructor(private router: Router) {
    this.extras = this.router.getCurrentNavigation()?.extras.state as GameExtras;
  }

  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement, this.extras?.image, this.extras?.pieces);
      })();
    });
  }

  onBack() {
    this.websocket.sendMessage({Type: "disconnect"});
  }

  previewImage() {
    if (!this.imageUri) {
      this.imageUri = this.game.getImageUri();
    }

    if (this.imageUri) {
      this.showImage = !this.showImage;
    }
  }

  ngOnDestroy() {
    this.game.destroy();
  }
}
