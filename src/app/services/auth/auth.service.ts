import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, catchError, Observable, switchMap, tap, throwError} from "rxjs";
import {environment} from "../../../environments/environment";
import {UserInfo} from "./user-info";

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  userInfo$ = this.userInfoSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(API_URL + "/register", {username, password});
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<UserInfo>(API_URL + "/login", {username, password}).pipe(
      tap(response => this.userInfoSubject.next(response))
    );
  }

  logoutSessions() {
    return this.http.get(API_URL + "/logout-sessions").pipe(
      tap(() => this.userInfoSubject.next(null))
    );
  }

  private refreshToken() {
    return this.http.get(API_URL + "/refresh-token");
  }

  tryGetUserInfo() {
    if (this.userInfoSubject.value != null) {
      return;
    }

    this.http.get<UserInfo>(API_URL + "/user-info").pipe(
      catchError(error => {
        if (error.status === 401) {
          return this.refreshToken().pipe(
            switchMap(() => {
              return this.http.get<UserInfo>(API_URL + "/user-info");
            })
          )
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => this.userInfoSubject.next(response),
      error: (error) => {
        if (error.status != 401) {
          console.log(error);
        }
      }
    });
  }
}
