import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service'; 
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { matAddAPhotoRound } from '@ng-icons/material-icons/round';
import { ionCloseCircleSharp } from '@ng-icons/ionicons';
import { ionCloseCircleOutline } from '@ng-icons/ionicons'; 

@Component({
  selector: 'app-paso-cinco',
  templateUrl: './paso-cinco.component.html',
  styleUrls: ['./paso-cinco.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, matAddAPhotoRound, ionCloseCircleSharp, ionCloseCircleOutline})]
})
export class PasoCincoComponent {
  constructor( private pasos: PasosVenderService, private router: Router) {}
  submitValue = false;
  estilos!: any;
  fotos!: ((File | string)[])[]

  ngOnInit(): void {
    this.pasos.paso5 ? true : this.router.navigate(['/publicar', 'formulario', 'paso4']);
    if(this.pasos.producto){
      this.estilos = [];
      this.fotos = [];
      this.definirEstilos(this.pasos.producto.estilos);

      if(this.pasos.producto.estilos[0].fotos){
        this.pasos.producto.estilos.forEach((estilo: any, i: any) => {
          if(estilo.fotos){
            estilo.fotos.forEach((foto: any, index: any) => {
              if (foto !== '') {
                this.fotos[i][index]= foto;
                const reader = new FileReader();
                reader.onload = () => {
                  const imageDataUrl = reader.result as string;
                  this.estilos[i].fotos[index] = imageDataUrl;
                };
                reader.readAsDataURL(foto);
              }
            });
            this.estilos[i].unidades = estilo.unidades;
            this.estilos[i].sku = estilo.sku;
          }
        });
        

        this.estilos.forEach((element: any) => {
          if(!element.fotos){
            element.fotos = ['','','','',''];
            element.unidades = '';
            element.sku = '';
          }
        });
        setTimeout(()=>{
          this.validarCampos();
        },1000)
      }
    }
  }
  definirEstilos(estilos: any){
    estilos.forEach((element: any) => {
      this.estilos.push({
        nombre: element.nombre, 
        fotos: ['','','','',''],
        unidades: '',
        sku: ''
      })
      this.fotos.push(['', '', '', '', '']);
    });
  }

  subirFoto(event: any, i: number, index: number) {
    const file = event.target.files[0];
    const extenciones = ['jpg', 'jpeg', 'png'];
    if (file) {
      const nombre = file.name.split('.');
      const fileExtension = nombre[nombre.length - 1].toLowerCase();
      if (extenciones.includes(fileExtension)) { //Validar extensión de la foto
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if(file.size <= 5000000){ //Validar tamaño de la foto, no superior a 5 MB
            const imageDataUrl = reader.result as string;
            this.estilos[i].fotos[index] = imageDataUrl;
            this.fotos[i][index] = file;
            if(index >= 4 && index < 7){
              this.estilos[i].fotos.push('');
              this.fotos[i][index] = file;
            }
          }else{
            event.preventDefault();
            alert('El peso maximo de cada foto es de 5MB');
          }
        };
      } else {
        alert('Solo se permiten archivos PNG y JPG.');
        event.target.value = ''; // Limpia el valor del input para evitar que el usuario suba el archivo incorrecto nuevamente
      }
    }
    setTimeout(()=>{
      this.validarCampos();
    },10)
  }

  eliminarFoto(i: number, index: number){
    this.estilos[i].fotos.splice(index, 1);
    this.fotos[i].splice(index, 1);
    if(this.estilos[i].fotos.length <= 4){
      this.estilos[i].fotos.push('');
      this.fotos[i].push('');
    }
    this.validarCampos();
  }

  actualizarDatosInputs(event: Event, i: number, tipo: string){  //  (Input)
    const input = event.target as HTMLInputElement;
    if(input.value == '0' || input.value == '00'){
      input.value = '';
      return;
    }
    if(tipo === 'unidades'){
      this.estilos[i].unidades = input.value;
    }else{
      this.estilos[i].sku = input.value;
    }
    this.validarCampos();
    if(this.pasos.producto.tipoPublicacion){
      delete this.pasos.producto.tipoPublicacion;
    }
  }

  validadCampo(key: KeyboardEvent, event: Event) {   //  (keydown)
    const input = event.target as HTMLInputElement;
    if (key.key?.toLowerCase() === 'e' || (input.value.length === 3 && key.key !== 'Backspace') || (input.value.length === 0 && key.key === '0')) {
      key.preventDefault(); 
    }
  }

  validarCampos(){
    let error = false;
    this.estilos.forEach((element: any)=>{
      if(element.fotos[0] === ''){
        error = true;
      }
      if(!element.unidades){
        error = true;
      }
    })
    error ? this.submitValue = false : this.submitValue = true;
  }

  submit(): any {
    this.fotos.forEach((fotos:any, index: any) => { //Asignar fotos FILE a estilos.
        this.estilos[index].fotos = fotos;
        this.estilos[index].unidades = Number(this.estilos[index].unidades);
    });
    this.pasos.paso6 = true;
    this.pasos.producto.estilos = this.estilos;
    this.router.navigate(['/publicar', 'formulario', 'paso6']);
  }

  atras(): void {
    this.fotos.forEach((fotos:any, index: any) => {
      this.estilos[index].fotos = fotos;
    });
    this.pasos.producto.estilos = this.estilos;
    this.router.navigate(['/publicar', 'formulario', 'paso4']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
