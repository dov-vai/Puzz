import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HostGameComponent} from './host-game.component';
import {Subject} from "rxjs";
import {Router} from "@angular/router";
import {RoomService} from "../../services/room/room.service";

describe('HostGameComponent', () => {
  let component: HostGameComponent;
  let fixture: ComponentFixture<HostGameComponent>;
  let mockRoomService: any;
  let mockRouter: any;
  let messageSubject: Subject<any>;

  beforeEach(async () => {
    messageSubject = new Subject();

    mockRoomService = {
      hostRoom: jasmine.createSpy('hostRoom').and.returnValue(messageSubject.asObservable())
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [HostGameComponent],
      providers: [
        {provide: RoomService, useValue: mockRoomService},
        {provide: Router, useValue: mockRouter},
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HostGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    const form = component.roomForm;
    expect(form).toBeTruthy();
    expect(form.get('title')?.value).toBe('');
    expect(form.get('image')?.value).toBeNull();
    expect(form.get('pieces')?.value).toBe(100);
    expect(form.get('publicRoom')?.value).toBeFalse();
  });

  it('should validate the title field as required', () => {
    const titleControl = component.title;
    expect(titleControl?.valid).toBeFalse();
    titleControl?.setValue('room');
    expect(titleControl?.valid).toBeTrue();
  });

  it('should validate pieces with a minimum value of 2', () => {
    const piecesControl = component.pieces;
    piecesControl?.setValue(1);
    expect(piecesControl?.valid).toBeFalse();
    piecesControl?.setValue(2);
    expect(piecesControl?.valid).toBeTrue();
  });

  it('should host room and navigate on submit', () => {
    component.title?.setValue('Test Room');
    component.pieces?.setValue(10);
    component.publicRoom?.setValue(true);
    const mockFile = new File([''], 'image.png', { type: 'image/png' });
    component.roomForm.patchValue({ image: mockFile });

    component.onSubmit();

    const hostResponse = { roomId: '123' };
    messageSubject.next(hostResponse);

    expect(mockRoomService.hostRoom).toHaveBeenCalledWith({
      Title: 'Test Room',
      Pieces: 10,
      Public: true
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['play', '123'], {
      state: { image: mockFile, pieces: 10 }
    });
  });
});
