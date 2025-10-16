import { Component,NgZone, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-paso-uno',
  templateUrl: './paso-uno.component.html',
  styleUrls: ['./paso-uno.component.scss']
})
export class PasoUnoComponent implements OnInit{
  constructor(private pasos: PasosVenderService,private router: Router,private changeDetector: ChangeDetectorRef) {}
  boxes: string[] = ['check1', 'check2', 'check3', 'check4', 'check5', 'check6', 'check7'];
  images: string[] = [ 'assets/img/categoria/iconos/cuadros.svg', 'assets/img/categoria/iconos/repisas.svg', 'assets/img/categoria/iconos/iluminacion.svg', 'assets/img/categoria/iconos/macetas.svg', 'assets/img/categoria/iconos/relojes.svg', 'assets/img/categoria/iconos/difusores.svg', 'assets/img/categoria/iconos/repisas.svg' ];
  titulos: string[] = [ 'Cuadros', 'Repisas', 'Iluminacion', 'Macetas', 'Relojes', 'Difusores', 'Adornos'];

  formValue!: string;
  disabled = true;
  alerta = false;
  nuevoInput!: number;

  ngOnInit(): void {
    if (this.pasos.producto !== undefined && this.pasos.producto.categoria) {
      this.formValue = this.pasos.producto.categoria;
      this.disabled = false;
      this.changeDetector.detectChanges();
    }
  }

  changeDisabled(event:Event, index:number, categoria: string): void {
    if(this.pasos.producto){
      if(this.pasos.producto.nombre){
        event.preventDefault();
        if(categoria !== this.pasos.producto.categoria){
          this.alerta = true;
          this.nuevoInput = index;
        }
      }
    }
    this.disabled = false;

    // Aquí seleccionamos manualmente el input radio correspondiente al índice
  }

  alert(opcion: boolean){
    this.alerta = false;
    if(opcion){
      this.pasos.producto = undefined;
      const inputs = document.querySelectorAll('input[type="radio"]');
      if (inputs && inputs.length > this.nuevoInput) {
        (inputs[this.nuevoInput] as HTMLInputElement).checked = true;
      }
      this.updateFormValue(this.titulos[this.nuevoInput]);
    }
  }
  updateFormValue(newValue: string) {
    this.formValue = newValue;
  }
  

  submit(form: NgForm): any {
    if (form.valid && !this.disabled) {
      if(this.pasos.producto){
        this.pasos.producto.categoria = form.value.categoria;
      }else{
        this.pasos.producto = { categoria: form.value.categoria };
      }
      this.pasos.paso2 = true;
      this.router.navigate(['/publicar', 'formulario', 'paso2']);
    } else {
      return false;
    }
  }

}
