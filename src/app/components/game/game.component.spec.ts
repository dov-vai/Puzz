import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GameComponent} from './game.component';
import {GameService} from "../../services/game/game.service";
import {WebSocketService} from "../../services/web-socket/web-socket.service";
import {provideRouter} from "@angular/router";

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let gameServiceMock: any;
  let webSocketServiceMock: any;

  beforeEach(async () => {
    gameServiceMock = {
      init: jasmine.createSpy('init').and.returnValue(Promise.resolve()),
      getImageUri: jasmine.createSpy('getImageUri').and.returnValue("uri"),
      destroy: jasmine.createSpy('destroy')
    }

    webSocketServiceMock = {
      sendMessage: jasmine.createSpy('sendMessage'),
    }

    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        {provide: GameService, useValue: gameServiceMock},
        {provide: WebSocketService, useValue: webSocketServiceMock},
        provideRouter([]),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle image preview', () => {
    component.previewImage();
    expect(component.showImage).toBeTrue();

    component.previewImage();
    expect(component.showImage).toBeFalse();
  });

  it('should get image URI when previewing image for the first time', () => {
    component.previewImage();

    expect(gameServiceMock.getImageUri).toHaveBeenCalled();
    expect(component.imageUri).toBe('uri');
    expect(component.showImage).toBeTrue();
  });

  it('should send a disconnect message on onBack()', () => {
    component.onBack();
    expect(webSocketServiceMock.sendMessage).toHaveBeenCalledWith({Type: 'disconnect'});
  });

  it('should destroy the game on ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(gameServiceMock.destroy).toHaveBeenCalled();
  });
});
