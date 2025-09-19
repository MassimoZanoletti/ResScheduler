import { TestBed } from '@angular/core/testing';

import { IscrittiService } from './iscritti.service';

describe('IscrittiService', () => {
  let service: IscrittiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IscrittiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
