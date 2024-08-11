import { TestBed } from '@angular/core/testing';

import { ShipstationService } from './shipstation.service';

describe('ShipstationService', () => {
  let service: ShipstationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShipstationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
