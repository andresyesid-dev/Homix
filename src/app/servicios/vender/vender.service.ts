import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PasosVenderService {

  paso1 = true;
  paso2 = false;
  paso3 = false;
  paso4 = false;
  paso5 = false;
  paso6 = false;
  paso7 = false;
  paso8 = false;
  paso9 = false;
  paso10 = false;
  
  producto!: any;

  idProducto!: string | null;
  fotoProducto!: string;
  nombre!: string;

  restablecerDatos(){
    this.paso1 = true;
    this.paso2 = false;
    this.paso3 = false;
    this.paso4 = false;
    this.paso5 = false;
    this.paso6 = false;
    this.paso7 = false;
    this.paso8 = false;
    this.paso9 = false;
    this.paso10 = false;
    
    this.producto =  {};
  }

  characterCountValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value) {
        const valueWithoutSpaces = control.value.replace(/\s/g, ''); // Eliminar espacios en blanco.
        const characterCount = valueWithoutSpaces.length;
  
        if (characterCount < min || characterCount > max) {
          return { characterCountInvalid: true };
        }
      }
      return null;
    };
  }
  
                                                                
}
