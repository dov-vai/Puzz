import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy, OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import {GameService} from "../../services/game/game.service";

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  game = inject(GameService);
  ngZone = inject(NgZone);
  renderer = inject(Renderer2)

  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    // disable the scroll bars because it breaks zooming the infinity canvas
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement);
      })();
    });
  }

  ngOnDestroy() {
    this.renderer.removeStyle(document.body, 'overflow');
    this.game.destroy();
  }
}
