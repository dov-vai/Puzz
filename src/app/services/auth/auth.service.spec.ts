import {TestBed} from '@angular/core/testing';

import {AuthService} from './auth.service';
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {provideHttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  afterEach(() => {
    httpMock.verify();
  })

  it('should make a POST request to /register with the correct payload', () => {
    const mockResponse = {success: true};
    const username = 'testuser';
    const password = 'testpassword';

    service.register(username, password).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({username, password});

    req.flush(mockResponse);
  });

  it('should make a POST request to /login with the correct payload', () => {
    const mockResponse = {success: true};
    const username = 'testuser';
    const password = 'testpassword';

    service.login(username, password).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({username, password});

    req.flush(mockResponse);
  });
});
