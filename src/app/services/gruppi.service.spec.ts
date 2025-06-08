import { TestBed } from '@angular/core/testing';

import { GruppiService } from './gruppi.service';

describe('GruppiService', () => {
  let service: GruppiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GruppiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
