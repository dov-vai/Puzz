import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {Subscription} from "rxjs";

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
export class HostGameComponent implements OnInit, OnDestroy {
  websocket = inject(WebSocketService);
  router = inject(Router);
  subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = this.websocket.messages$.subscribe(this.onMessage.bind(this));
    this.websocket.connect();
  }

  roomForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    image: new FormControl((null as File | null), [Validators.required]),
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

  get image() {
    return this.roomForm.get('image');
  }

  get imageClass() {
    if (!this.image?.dirty && this.image?.untouched) {
      return "";
    }

    if (this.image?.invalid) {
      return 'is-danger';
    }

    return 'is-success';
  }

  get publicRoom() {
    return this.roomForm.get('publicRoom');
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) {
      this.roomForm.patchValue({image: file});
    }
  }

  onSubmit() {
    this.websocket.sendMessage({Type: "host", Title: this.title?.value, Public: this.publicRoom?.value});
  }

  onMessage(message: any) {
    switch (message.Type) {
      case "connected": {
        console.log("connected succesfully, SocketId:", message.SocketId);
        this.router.navigate(['play']);
        break;
      }
      default: {
        console.log("invalid message?", message);
        break;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
