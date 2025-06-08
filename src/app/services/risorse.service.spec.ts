import { TestBed } from '@angular/core/testing';

import { RisorseService } from './risorse.service';

describe('RisorseService', () => {
  let service: RisorseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RisorseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
