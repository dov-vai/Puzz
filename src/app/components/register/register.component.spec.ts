import {ComponentFixture, TestBed} from '@angular/core/testing';

import {RegisterComponent} from './register.component';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth/auth.service";
import {of, throwError} from "rxjs";

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['register']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        {provide: AuthService, useValue: authServiceMock},
        {provide: Router, useValue: routerMock},
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should have a valid form when all fields are filled correctly', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['password'].setValue('password');
    component.registerForm.controls['confirmPassword'].setValue('password');
    expect(component.registerForm.valid).toBeTrue();
  });

  it('should set passwordsMatch to false when passwords do not match', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['confirmPassword'].setValue('password');

    component.onSubmit();

    expect(component.passwordsMatch).toBeFalse();
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should call authService.register when form is valid and passwords match', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['password'].setValue('password');
    component.registerForm.controls['confirmPassword'].setValue('password');
    authServiceMock.register.and.returnValue(of({}));

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith('testuser', 'password');
  });

  it('should set usernameTaken to true if registration fails due to username being taken', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['password'].setValue('password');
    component.registerForm.controls['confirmPassword'].setValue('password');
    authServiceMock.register.and.returnValue(throwError(() => new Error('Username taken')));

    component.onSubmit();

    expect(component.usernameTaken).toBeTrue();
  });

  it('should navigate to login page upon successful registration', () => {
    component.registerForm.controls['username'].setValue('testuser');
    component.registerForm.controls['password'].setValue('password');
    component.registerForm.controls['confirmPassword'].setValue('password');
    authServiceMock.register.and.returnValue(of({}));

    component.register();

    expect(routerMock.navigate).toHaveBeenCalledWith(['login']);
  });
});
