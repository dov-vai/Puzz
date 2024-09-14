import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {Observable} from "rxjs";
import {UserInfo} from "../../services/auth/user-info";
import {AsyncPipe} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  userInfo$!: Observable<UserInfo | null>;

  ngOnInit(): void {
    this.userInfo$ = this.authService.userInfo$;
  }

  logoutSessions() {
    this.authService.logoutSessions().subscribe({
      next: () => this.router.navigate(['/login']),
      error: error => console.log("failed logging out all sessions", error)
    });

  }
}
