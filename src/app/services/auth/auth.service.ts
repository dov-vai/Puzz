import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, map, Observable} from "rxjs";
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
      map(response => this.userInfoSubject.next(response)),
    );
  }

  tryGetUserInfo() {
    if (this.userInfoSubject.value != null) {
      return;
    }

    this.http.get<UserInfo>(API_URL + "/user-info").subscribe({
      next: (response) => this.userInfoSubject.next(response),
      error: (error) => {
        if (error.status != 401) {
          console.log(error);
        }
      }
    });
  }
}
