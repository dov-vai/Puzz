import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(API_URL + "/register", {username, password});
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(API_URL + "/login", {username, password});
  }
}
