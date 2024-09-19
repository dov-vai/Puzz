import {Component, inject, OnDestroy} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {GameExtras} from "../game/game.component";
import {JigsawEstimator} from "../../pixi/jigsaw/jigsaw-estimator";
import {RoomService} from "../../services/room/room.service";
import {Host} from "../../services/room/types";

@Component({
  selector: 'app-host-game',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './host-game.component.html',
  styleUrl: './host-game.component.css'
})
export class HostGameComponent implements OnDestroy {
  private roomService = inject(RoomService);
  router = inject(Router);
  img?: HTMLImageElement;
  estimatedPieces?: { rows: number, columns: number, pieceWidth: number, pieceHeight: number };

  roomForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    image: new FormControl((null as File | null), [Validators.required]),
    pieces: new FormControl(100, [Validators.required, Validators.min(2)]),
    publicRoom: new FormControl(false),
  })

  get title() {
    return this.roomForm.get('title');
  }

  get titleClass() {
    if (!this.title?.dirty && this.title?.untouched) {
      return '';
    }
    if (this.title?.invalid) {
      return 'is-danger';
    }
    return 'is-success';
  }

  get publicRoom() {
    return this.roomForm.get('publicRoom');
  }

  get image() {
    return this.roomForm.get('image');
  }

  get pieces() {
    return this.roomForm.get('pieces');
  }

  setPieces(pieces: number) {
    this.roomForm.patchValue({pieces: pieces});
    this.calculatePieces();
  }

  onPiecesChanged(event: Event) {
    this.calculatePieces();
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) {
      this.roomForm.patchValue({image: file});
      this.revokeImageUrl();
      this.img = new Image();
      this.img.onload = () => {
        this.calculatePieces();
      }
      this.img.src = URL.createObjectURL(file);
    }
  }

  private calculatePieces() {
    if (this.img?.complete && this.pieces?.valid) {
      const pieces = this.pieces?.value;
      this.estimatedPieces = JigsawEstimator.estimate(this.img.width, this.img.height, Number(pieces), "backwards");
    }
  }

  onSubmit() {
    const host: Host = {
      Title: this.title?.value!,
      Pieces: this.pieces?.value!,
      Public: this.publicRoom?.value!
    };

    this.roomService.hostRoom(host).subscribe({
      next: response => {
        // TODO: image verification
        const extras: GameExtras = {image: this.image!.value!, pieces: Number(this.pieces!.value)}
        this.router.navigate(['play', response.roomId], {state: extras});
      },
      error: error => {
        console.log("error hosting the game", error);
      }
    })
  }

  private revokeImageUrl() {
    if (this.img) {
      URL.revokeObjectURL(this.img.src);
    }
  }

  ngOnDestroy(): void {
    this.revokeImageUrl();
  }
}
