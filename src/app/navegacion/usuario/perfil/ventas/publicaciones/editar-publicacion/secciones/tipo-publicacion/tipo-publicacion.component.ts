import { Component, Input } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { ionCheckmarkSharp } from '@ng-icons/ionicons';
import { ionInformationCircleOutline } from '@ng-icons/ionicons';
import { aspectsInformation } from '@ng-icons/ux-aspects';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-tipo-publicacion',
  templateUrl: './tipo-publicacion.component.html',
  styleUrls: ['./tipo-publicacion.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, ionCheckmarkSharp, ionInformationCircleOutline, aspectsInformation, matCheck})]
})
export class TipoPublicacionComponent {
  constructor(private firestore: Firestore) {}
  @Input() estilos!: any;
  @Input() tipoPublicacion!: string;
  @Input() precio!: number;
  @Input() productoId!: string;
  submitValue = false;
  gratuito = false;
  basico = false;
  premium = false;

  precioBasico!: number;
  precioPremium!: number;

  actualizacionExitosa = false;
  cambios = false;

  gratuita = true;
  verDetalles = false;

  ngOnInit(): void {
    this.definirPrecios()
  }

  definirPrecios(){
    if(this.estilos.length > 1 || this.estilos[0].unidades > 1 || this.tipoPublicacion !== 'gratuita'){
      this.gratuita = false;
    }
    switch (this.tipoPublicacion){
      case 'gratuita': this.gratuito = true; break
      case 'basica': this.basico = true; break
      case 'premium': this.premium = true; break
    }
    this.submitValue = true;
    this.precioBasico = this.precio * 0.07;
    this.precioPremium = this.precio * 0.11;
  }

  cambiarPlan(plan: string){
    if(plan === "gratuito"){
      this.gratuito = true;
      this.basico = false;
      this.premium = false;
    }else if(plan === "basico"){
      this.gratuito = false;
      this.basico = true;
      this.premium = false;
    }else if(plan === "premium"){
      this.gratuito = false;
      this.basico = false;
      this.premium = true;
    }
    this.submitValue = true;
  }

  //----------------------------
  async submit(): Promise<any> {
    this.actualizacionExitosa = true;
    setTimeout(()=>{
      this.actualizacionExitosa = false;
      this.cambios = false;
    }, 1500)
    this.tipoPublicacionSeleccionada();
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {tipoPublicacion: this.tipoPublicacion});
  }

  tipoPublicacionSeleccionada(){
    if(this.gratuito){
      this.tipoPublicacion = 'gratuita'
    }else if(this.basico){
      this.tipoPublicacion = 'basica'
    }else if(this.premium = true){
      this.tipoPublicacion = 'premium'
    }
  }
}
