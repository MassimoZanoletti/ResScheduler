import { TestBed } from '@angular/core/testing';

import { EventiMasterService } from './eventi-master.service';

describe('EventiMasterService', () => {
  let service: EventiMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventiMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
