import { TestBed } from '@angular/core/testing';

import { SocietaService } from './societa.service';

describe('SocietaService', () => {
  let service: SocietaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocietaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
