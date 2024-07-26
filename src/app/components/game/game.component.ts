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

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements AfterViewInit, OnDestroy {
  game = inject(GameService);
  ngZone = inject(NgZone);

  @ViewChild("gameCanvas")
  gameCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      (async () => {
        await this.game.init(this.gameCanvas.nativeElement);
      })();
    });
  }

  ngOnDestroy() {
    this.game.destroy();
  }
}
