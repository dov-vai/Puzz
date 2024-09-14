import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AuthService} from "../../services/auth/auth.service";
import {Observable} from "rxjs";
import {UserInfo} from "../../services/auth/user-info";
import {AsyncPipe, NgClass} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    AsyncPipe,
    NgClass
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  userInfo$!: Observable<UserInfo | null>;

  ngOnInit(): void {
    this.userInfo$ = this.authService.userInfo$;
  }

  logout() {
    this.authService.logout().subscribe();
  }

  isRouteActive(route: string) {
    return this.router.isActive(
      route,
      {
        paths: 'exact',
        queryParams: 'exact',
        fragment: 'ignored',
        matrixParams: 'ignored'
      });
  }

}
