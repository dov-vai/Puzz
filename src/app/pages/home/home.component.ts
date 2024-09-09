import {Component, inject, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AuthService} from "../../services/auth/auth.service";
import {Observable} from "rxjs";
import {UserInfo} from "../../services/auth/user-info";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    AsyncPipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  userInfo$!: Observable<UserInfo | null>;

  ngOnInit(): void {
    this.userInfo$ = this.authService.userInfo$;
  }


}
