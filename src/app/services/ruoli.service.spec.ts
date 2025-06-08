import { TestBed } from '@angular/core/testing';

import { RuoliService } from './ruoli.service';

describe('RuoliService', () => {
  let service: RuoliService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuoliService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
