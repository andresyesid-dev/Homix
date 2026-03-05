import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-paso-nueve',
  templateUrl: './paso-nueve.component.html',
  styleUrls: ['./paso-nueve.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft})]
})

export class PasoNueveComponent {
  constructor( private pasos: PasosVenderService, private router: Router) {}
  submitValue = false;
  precioMenor = false;
  envioGratis = false;
  sinEnvioGratis = false;
  
  ngOnInit(): void {
    this.pasos.paso7 ? this.definirEnvios() : this.router.navigate(['/publicar', 'formulario', 'paso6']);
  }

  definirEnvios(){
    if(this.pasos.producto.precio <= 25000){
      this.precioMenor = true;
      this.submitValue = true;
    }else if(this.pasos.producto){
      if(this.pasos.producto.envioGratis != undefined){
        if(this.pasos.producto.envioGratis){
          this.envioGratis = true;
        }else {
          this.sinEnvioGratis = true;
        }
        this.submitValue = true;
      }
    }
  }

  check(dato: string){
    if(dato == 'gratis'){
      this.envioGratis = true;
      this.sinEnvioGratis = false;
    }else{
      this.envioGratis = false;
      this.sinEnvioGratis = true;
    }
    this.submitValue = true;
  }

  submit(): any {
    this.pasos.paso10 = true;
    this.pasos.producto.envioGratis = this.envioGratis;
    this.router.navigate(['/publicar', 'formulario', 'paso10']);
  }

  atras(): void {
    this.pasos.producto.envioGratis = this.envioGratis;
    this.router.navigate(['/publicar', 'formulario', 'paso8']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
