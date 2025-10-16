import { Component, Input } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';

@Component({
  selector: 'app-descripcion',
  templateUrl: './descripcion.component.html',
  styleUrls: ['./descripcion.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class DescripcionComponent {
  constructor( private router: Router, private firestore: Firestore) {}
  @Input() descripcion!: string | null | undefined;
  @Input() productoId!: string;
  submitValue = true;
  nuevoTexto = '';
  actualizacionExitosa = false;
  cambios = false;

  ngOnInit(): void {
    if(this.descripcion == ''){
      this.descripcion = null
    }
    this.asignarDatos();
  }

  asignarDatos(){
    if(this.descripcion){
      this.nuevoTexto = this.descripcion;
      this.descripcion = this.descripcion;
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    navigator.clipboard.readText().then((text) => {
      document.execCommand('insertText', false, text);
    });
  }
  
  onInputChange(event: any) {
    this.cambios = true;
    this.descripcion = event.target.innerText;
  }

  focus(){
    if(this.descripcion == null){
      this.descripcion = '';
    }
  }

  async submit() {
    this.descripcion = this.descripcion!.trim();
    this.actualizacionExitosa = true;
    setTimeout(()=>{
      this.actualizacionExitosa = false;
      this.cambios = false;
    }, 1500)
    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {descripcion: this.descripcion});
  }

}
