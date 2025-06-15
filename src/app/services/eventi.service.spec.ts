import { TestBed } from '@angular/core/testing';

import { EventiService } from './eventi.service';

describe('EventiService', () => {
  let service: EventiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
