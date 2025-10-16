import { Component, Input } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-envio',
  templateUrl: './envio.component.html',
  styleUrls: ['./envio.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class EnvioComponent {
  constructor( private pasos: PasosVenderService, private router: Router, private firestore: Firestore) {}
  @Input() precio!: number;
  @Input() envioGratis!: boolean;
  @Input() productoId!: string;
  submitValue = false;
  precioMenor = false;
  sinEnvioGratis = false;
  actualizacionExitosa = false;
  cambios = false;
  
  ngOnInit(): void {
    this.definirEnvios();
  }

  definirEnvios(){
    if(this.precio <= 25000){
      this.precioMenor = true;
      this.submitValue = true;
    }else{
      if(!this.envioGratis){
        this.sinEnvioGratis = true;
      }
      this.submitValue = true;
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

  async submit() {
    this.actualizacionExitosa = true;
    setTimeout(()=>{
      this.actualizacionExitosa = false;
      this.cambios = false;
    }, 1500)
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {envioGratis: this.envioGratis});
  }

}
