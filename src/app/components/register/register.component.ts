import {Component, inject} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  usernameTaken = false;
  passwordsMatch = true;

  registerForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required])
  })

  get username() {
    return this.registerForm.get('username')?.value;
  }

  get password() {
    return this.registerForm.get('password')?.value;
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword')?.value;
  }

  onSubmit() {
    this.usernameTaken = false;
    this.passwordsMatch = true;
    if (this.password != this.confirmPassword) {
      this.passwordsMatch = false;
    } else {
      this.register();
    }
  }

  register() {
    this.authService.register(this.username!, this.password!).subscribe({
      next: (response) => this.router.navigate(['login']),
      error: (error) => this.usernameTaken = true,
    });
  }
}
