import { Component, Input } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-datos-principales',
  templateUrl: './datos-principales.component.html',
  styleUrls: ['./datos-principales.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class DatosPrincipalesComponent {
  constructor(private pasos: PasosVenderService, private formBuilder: FormBuilder, private firestore: Firestore) {}
  @Input() autoria!: string;
  @Input() marca!: string;
  @Input() modelo!: string;
  @Input() productoId!: string;
  form!: FormGroup;
  submitValue = false;
  hechoPorMi = false;
  autoriaEntrante!: string;
  hechoPorMiEntrante!: boolean;
  actualizacionExitosa = false;
  cambios = false;
  
  ngOnInit(): void {
    this.buildForm()
  }

  private buildForm(): void {
    if(this.autoria == 'Hecho por mi'){
      this.hechoPorMiEntrante = true;
      this.hechoPorMi = true;
      this.submitValue = true;
    }else if(this.autoria){
      this.autoriaEntrante = this.autoria;
    }
    this.form = this.formBuilder.group({
      autoria: [this.autoriaEntrante, [Validators.required, this.pasos.characterCountValidator(2,50)]],
      hechoPorMi: [this.hechoPorMiEntrante, []],
      marca: [this.marca, []],
      modelo: [this.modelo, []],
    });
    if(this.form.valid){
      this.submitValue = true;
    }
  }

  validar(){
    this.cambios = true;
    if(this.form.value.hechoPorMi == true){
      this.hechoPorMi = true;
      this.submitValue = true;
    }else{
      this.hechoPorMi = false;
      this.submitValue = false;
      if(this.form.valid){
        this.submitValue = true;
      }
    }
  }

  async submit() {
    if(this.form.value.hechoPorMi == true){
      this.autoria = 'Hecho por mi';
    }else{
      this.autoria = this.form.value.autoria.replace(/\s+/g, ' ').trim();
    }
    this.form.value.marca ? this.marca = this.form.value.marca.replace(/\s+/g, ' ').trim() : this.marca = 'Genérica'
    this.form.value.modelo ? this.modelo = this.form.value.modelo.replace(/\s+/g, ' ').trim() : this.modelo = 'N/A'

    this.actualizacionExitosa = true;
    setTimeout(()=>{
      this.actualizacionExitosa = false;
      this.cambios = false;
    }, 1500)
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {autoria: this.autoria});
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {marca: this.marca});
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {modelo: this.modelo});
  }
}
