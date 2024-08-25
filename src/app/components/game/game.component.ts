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

export interface GameExtras {
  image?: File;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    RouterLink
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

  constructor(private router: Router) {
    this.extras = this.router.getCurrentNavigation()?.extras.state as GameExtras;
  }

  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement, this.extras?.image);
      })();
    });
  }

  onBack() {
    this.websocket.sendMessage({Type: "disconnect"});
  }

  previewImage() {

  }

  ngOnDestroy() {
    this.game.destroy();
  }
}
