import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PublicGamesComponent, PublicRoom} from './public-games.component';
import {Router} from "@angular/router";
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {Subject} from "rxjs";

describe('PublicGamesComponent', () => {
  let component: PublicGamesComponent;
  let fixture: ComponentFixture<PublicGamesComponent>;
  let websocketServiceMock: jasmine.SpyObj<WebSocketService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    websocketServiceMock = jasmine.createSpyObj('WebSocketService', ['connect', 'sendMessage'], {
      messages$: new Subject()
    });
    routerMock = jasmine.createSpyObj('Router', ['navigate']);


    await TestBed.configureTestingModule({
      imports: [PublicGamesComponent],
      providers: [
        {provide: WebSocketService, useValue: websocketServiceMock},
        {provide: Router, useValue: routerMock},
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PublicGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle publicRooms message', () => {
    const rooms: PublicRoom[] = [{Id: '1', Title: 'Room 1', Pieces: 100, PlayerCount: 4}];
    component.onMessage({Type: 'publicRooms', Rooms: rooms});
    component.publicRooms$.subscribe(data => {
      expect(data).toEqual(rooms);
    });
  });

  describe('onMessage', () => {
    it('should handle publicRooms message', () => {
      const rooms: PublicRoom[] = [{Id: '1', Title: 'Room 1', Pieces: 100, PlayerCount: 4}];
      component.onMessage({Type: 'publicRooms', Rooms: rooms});
      component.publicRooms$.subscribe(data => {
        expect(data).toEqual(rooms);
      });
    });

    it('should handle connected message and navigate to the play route', () => {
      const message = {Type: 'connected', SocketId: '123', RoomId: '1'};
      component.onMessage(message);
      expect(routerMock.navigate).toHaveBeenCalledWith(['play', '1']);
    });

    it('should handle unknown message types without errors', () => {
      const unknownMessage = {Type: 'unknownType'};
      expect(() => component.onMessage(unknownMessage)).not.toThrow();
    });
  });

  describe('onRefreshRooms', () => {
    it('should send a publicRooms message', () => {
      component.onRefreshRooms();
      expect(websocketServiceMock.sendMessage).toHaveBeenCalledWith({Type: 'publicRooms'});
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from the websocket messages$', () => {
      component.ngOnInit();
      component.ngOnDestroy();
      expect(component.subscription.closed).toBeTrue();
    });
  });
});
