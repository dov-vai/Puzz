import {TestBed} from '@angular/core/testing';

import {PeerManagerService} from './peer-manager.service';

describe('PeerManagerService', () => {
  let service: PeerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
