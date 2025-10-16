import { TestBed } from '@angular/core/testing';

import { PasosVenderService } from './vender.service';

describe('VenderService', () => {
  let service: PasosVenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasosVenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
