import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PublicGamesComponent} from './public-games.component';
import {Router} from "@angular/router";
import {RoomService} from "../../services/room/room.service";
import {PublicRoom} from "../../services/room/public-room";
import {of} from "rxjs";

describe('PublicGamesComponent', () => {
  let component: PublicGamesComponent;
  let fixture: ComponentFixture<PublicGamesComponent>;
  let roomServiceMock: jasmine.SpyObj<RoomService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    roomServiceMock = jasmine.createSpyObj('RoomService', ['getPublicRooms']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PublicGamesComponent],
      providers: [
        {provide: RoomService, useValue: roomServiceMock},
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

  describe('ngOnInit', () => {
    it('should call onRefreshRooms', () => {
      spyOn(component, 'onRefreshRooms');
      component.ngOnInit();
      expect(component.onRefreshRooms).toHaveBeenCalled();
    });
  });

  describe('onJoin', () => {
    it('should navigate to the play route with roomId', () => {
      const roomId = '1';
      component.onJoin(roomId);
      expect(routerMock.navigate).toHaveBeenCalledWith(['play', roomId]);
    });
  });

  describe('onRefreshRooms', () => {
    it('should set publicRooms$ observable with rooms from RoomService', () => {
      const rooms: PublicRoom[] = [{id: '1', title: 'Room 1', pieces: 100, playerCount: 4}];
      roomServiceMock.getPublicRooms.and.returnValue(of(rooms));

      component.onRefreshRooms();

      component.publicRooms$.subscribe(data => {
        expect(data).toEqual(rooms);
      });
      expect(roomServiceMock.getPublicRooms).toHaveBeenCalled();
    });
  });
});
