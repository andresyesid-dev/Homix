import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-paso-siete',
  templateUrl: './paso-siete.component.html',
  styleUrls: ['./paso-siete.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft})]
})
export class PasoSieteComponent {
  constructor( private pasos: PasosVenderService, private router: Router, private changeDetector: ChangeDetectorRef, private formBuilder: FormBuilder) {}
  submitValue = true;
  descripcion!: string;
  nuevoTexto = '';

  ngOnInit(): void {
    this.pasos.paso7 ? this.asignarDatos() : this.router.navigate(['/publicar', 'formulario', 'paso6']);
  }

  asignarDatos(){
    if(this.pasos.producto.descripcion){
      this.nuevoTexto = this.pasos.producto.descripcion;
      this.descripcion = this.pasos.producto.descripcion;
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    navigator.clipboard.readText().then((text) => {
      document.execCommand('insertText', false, text);
    });
  }
  
  onInputChange(event: any) {
    this.descripcion = event.target.innerText;
  }

  focus(){
    if(this.descripcion == null){
      this.descripcion = '';
    }
  }

  submit(): any {
      this.pasos.paso8 = true;
      if(this.descripcion == null || this.descripcion == undefined){
        this.pasos.producto.descripcion = '';
      }else{
        this.pasos.producto.descripcion = this.descripcion.trim();
      }
      this.router.navigate(['/publicar', 'formulario', 'paso8']);
  }

  atras(): void {
    if(this.descripcion == null || this.descripcion == undefined){
      this.pasos.producto.descripcion = '';
    }else{
      this.pasos.producto.descripcion = this.descripcion.trim();
    }
    this.router.navigate(['/publicar', 'formulario', 'paso6']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
