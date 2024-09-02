import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LoginComponent} from './login.component';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth/auth.service";
import {of, throwError} from "rxjs";

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['login']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);


    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {provide: AuthService, useValue: authServiceMock},
        {provide: Router, useValue: routerMock},
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should have a valid form when username and password are provided', () => {
    component.loginForm.controls['username'].setValue('testuser');
    component.loginForm.controls['password'].setValue('password');
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should call authService.login on login', () => {
    component.loginForm.controls['username'].setValue('testuser');
    component.loginForm.controls['password'].setValue('password');
    authServiceMock.login.and.returnValue(of({}));

    component.login();

    expect(authServiceMock.login).toHaveBeenCalledWith('testuser', 'password');
  });

  it('should set invalid to true if login fails', () => {
    component.loginForm.controls['username'].setValue('testuser');
    component.loginForm.controls['password'].setValue('password');
    authServiceMock.login.and.returnValue(throwError(() => new Error('Login failed')));

    component.login();

    expect(component.invalid).toBeTrue();
  });

  it('should navigate to register when register is called', () => {
    component.register();

    expect(routerMock.navigate).toHaveBeenCalledWith(['register']);
  });
});
