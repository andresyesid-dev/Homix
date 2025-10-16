import { TestBed } from '@angular/core/testing';

import { EditarEstilosPublicacionService } from './editar-estilos-publicacion.service';

describe('EditarEstilosPublicacionService', () => {
  let service: EditarEstilosPublicacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditarEstilosPublicacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
