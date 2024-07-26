import {Injectable} from '@angular/core';
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import {webSocket} from "rxjs/webSocket";
import {catchError, EMPTY, Observable, Subject, switchAll, tap} from "rxjs";

export const WEBSOCKET_URL = "ws://localhost:5048/ws";

// implemented according to:
// https://javascript-conference.com/blog/real-time-in-angular-a-journey-into-websocket-and-rxjs/

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$!: WebSocketSubject<any>;
  private messagesSubject$ = new Subject<Observable<any>>();
  // The switchAll() operator unsubscribes from the previous observable whenever a new observable is emitted and subscribes to the new one.
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => {
    throw e;
  }))

  public connect() {
    if (!this.socket$ || !this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(
        tap({
          error: error => console.log(error),
        }),
        catchError(_ => EMPTY)
      );
      this.messagesSubject$.next(messages);
    }
  }

  private getNewWebSocket() {
    return webSocket({
        url: WEBSOCKET_URL,
        closeObserver: {
          next: () => {
            console.log("[WebSocketService] WebSocket closed");
          }
        }
      }
    );
  }

  sendMessage(message: any) {
    this.socket$.next(message);
  }

  close() {
    this.socket$.complete();
  }

  // TODO: socket reconnection
  // private shouldRetry(error: any){
  //   throw error;
  // }
  //
  // private reconnect(observable: Observable<any>) {
  //   return observable.pipe(retry({count: 3, delay:1000}));
  // }
}
