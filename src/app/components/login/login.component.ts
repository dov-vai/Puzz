import {Component, inject} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  invalid: boolean = false;

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  })

  get username() {
    return this.loginForm.get('username')?.value;
  }

  get password() {
    return this.loginForm.get('password')?.value;
  }

  login() {
    this.invalid = false;
    this.authService.login(this.username!, this.password!).subscribe({
      next: (response) => this.router.navigate(['profile']),
      error: (error) => this.invalid = true,
    });
  }

  register() {
    this.router.navigate(['register']);
  }
}
