import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import {GameService} from "../../services/game/game.service";
import {Router, RouterLink} from "@angular/router";

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
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  game = inject(GameService);
  ngZone = inject(NgZone);
  renderer = inject(Renderer2);
  extras?: GameExtras;

  constructor(private router: Router) {
    this.extras = this.router.getCurrentNavigation()?.extras.state as GameExtras;
  }

  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    // disable the scroll bars because it breaks zooming the infinity canvas
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement, this.extras?.image);
      })();
    });
  }

  ngOnDestroy() {
    this.renderer.removeStyle(document.body, 'overflow');
    this.game.destroy();
  }
}
