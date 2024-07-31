import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PublicGamesComponent} from './public-games.component';

describe('PublicGamesComponent', () => {
  let component: PublicGamesComponent;
  let fixture: ComponentFixture<PublicGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicGamesComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PublicGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
