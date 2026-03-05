import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditarEstilosPublicacionService {
  private estilosSource = new BehaviorSubject<any[] | undefined>(undefined);
  estilos = this.estilosSource.asObservable();

  constructor() { }

  cambiarEstilos(nuevoValor: any[]) {
    this.estilosSource.next(nuevoValor);
  }
}
