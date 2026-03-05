import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-titulo',
  templateUrl: './titulo.component.html',
  styleUrls: ['./titulo.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class TituloComponent implements OnInit{
  constructor(private pasos: PasosVenderService, private router: Router, private changeDetector: ChangeDetectorRef, private formBuilder: FormBuilder, private firestore: Firestore) {}
  @Input() titulo!: string;
  @Input() productoId!: string;
  form!: FormGroup;
  actualizacionExitosa = false;
  cambios = false;

  ngOnInit(): void {
    this.buildForm(this.titulo);
    this.changeDetector.detectChanges();
  }

  private buildForm(inDefault: string): void {
    this.form = this.formBuilder.group({
      titulo: [inDefault, [Validators.required, this.pasos.characterCountValidator(10,70)]]
    });
  }

  capitalizarNombreProducto(nombre: string): string {
    const nombreTrim = nombre.trim();
    const nombreLower = nombreTrim.toLowerCase();
    const palabras = nombreLower.split(' ');
  
    const palabrasCapitalizadas = palabras.map((palabra) => {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    });
  
    const resultado = palabrasCapitalizadas.join(' ');
  
    return resultado;
  }

  async submit() {
    if (this. form && this.form.valid) {
      this.titulo = this.form.value.titulo.replace(/\s+/g, ' ').trim();
      this.titulo = this.capitalizarNombreProducto(this.titulo);
      this.actualizacionExitosa = true;
      setTimeout(()=>{
        this.actualizacionExitosa = false;
        this.cambios = false;
      }, 1500)
      await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {nombre: this.titulo});
    }
  }
}
