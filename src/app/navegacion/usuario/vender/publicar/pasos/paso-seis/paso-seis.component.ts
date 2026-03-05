import { ChangeDetectorRef, Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { ionChevronDown } from '@ng-icons/ionicons';

@Component({
  selector: 'app-paso-seis',
  templateUrl: './paso-seis.component.html',
  styleUrls: ['./paso-seis.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, ionChevronDown})]
})
export class PasoSeisComponent {
  constructor( private pasos: PasosVenderService, private router: Router, private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({});
  }
  form!: FormGroup;
  submitValue = true;
  detalles!: any[];

  ngOnInit(): void {
    this.pasos.paso6 ? true : this.router.navigate(['/publicar', 'formulario', 'paso5']);
    if(this.pasos.producto){
      this.definirDetalles();
    }
  }

  definirDetalles(){
    const detalles: any = {
      Cuadros: [
        { nombre: 'Temática', tipo: 'input', detalle: 'tematica' },
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura' },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: ['Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Frase', tipo: 'selectSiNo', detalle: 'frase' },
        { nombre: 'Panel', tipo: 'selectSiNo', detalle: 'panel' },
          { nombre: 'Tipo de panel', tipo: 'input', detalle: 'tipoPanel', active: false }, 
        { nombre: 'Marco', tipo: 'selectSiNo', detalle: 'marco' },
          { nombre: 'Material de marco', tipo: 'input', detalle: 'materialMarco', active: false },
      ],
      Repisas: [
        { nombre: 'Cantidad de piezas', tipo: 'number', detalle: 'cantidadPiezas' },
        { nombre: 'Forma', tipo: 'input', detalle: 'forma'},
        { nombre: 'Materia', tipo: 'input', detalle: 'materia'},
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura' },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho' },
        { nombre: 'Profundidad', tipo: 'medida', detalle: 'profundidad', valorSelect: 'unidadMedidaProfundidad' },
        { nombre: 'Peso', tipo: 'medidaPeso', detalle: 'peso', valorSelect: 'unidadMedidaPeso' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: [ 'Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Incluye kit de instalación', tipo: 'selectSiNo', detalle: 'kitInstalacion' }
      ],
      Iluminacion: [
        { nombre: 'Tecnología de iluminación', tipo: 'select', opciones: [ 'Incandescente ', 'Halógena', 'Fluorescente', 'Led', 'Neón', 'UV'], detalle: 'tecnologiaIluminacion' },
        { nombre: 'Sub categoría', tipo: 'select', opciones: [ 'Bombillos', 'Lamparas', 'Letreros led'], detalle: 'subCategoria' },

        { nombre: 'Tipo', tipo: 'select', opciones: [ 'Mesa ', 'Techo', 'Pared'], detalle: 'tipo', active: false },
        { nombre: 'Estilo', tipo: 'input', detalle: 'estilo', active: false },
        { nombre: 'Material', tipo: 'input', detalle: 'material', active: false },

        { nombre: 'Poténcia', tipo: 'medidaPotencia', detalle: 'potencia', valorSelect: 'unidadMedidaPotencia', active: false },
        { nombre: 'Temperatura de color', tipo: 'medidaTemperatura', detalle: 'temperaturaColor', valorSelect: 'unidadMedidaTemperaturaColor', active: false }, //--
        { nombre: 'Forma', tipo: 'input', detalle: 'forma', active: false },
        { nombre: 'Sistemas operativos compatibles', tipo: 'input', detalle: 'sistemasOperativosCompatibles', active: false },
        { nombre: 'Apliaciones compatibles', tipo: 'input', detalle: 'apliacionesCompatibles', active: false },

        { nombre: 'Diseño', tipo: 'input', detalle: 'diseño', active: false },
        { nombre: 'Tipo de mensaje', tipo: 'input', detalle: 'tipoMensaje', active: false },
        { nombre: 'Fuente de alimentación', tipo: 'input', detalle: 'fuenteAlimentacion', active: false },
        { nombre: 'Montaje', tipo: 'input', detalle: 'montaje', active: false },
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura', active: false },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho', active: false },

        { nombre: 'Formato de venta', tipo: 'select', opciones: [ 'Unidades', 'Pack'], detalle: 'formatoVenta', active: false  },
          { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },

        { nombre: 'Inalambrico', tipo: 'selectSiNo', detalle: 'inalambrico', active: false },
        { nombre: 'Auto adhesiva', tipo: 'selectSiNo', detalle: 'autoadhesiva', active: false },
        { nombre: 'Regulable', tipo: 'selectSiNo', detalle: 'regulable', active: false },
        { nombre: 'Control remoto', tipo: 'selectSiNo', detalle: 'controlRemoto', active: false },
        { nombre: 'Sistema de presion', tipo: 'selectSiNo', detalle: 'sistemaDePresion', active: false },
        { nombre: 'Wifi', tipo: 'selectSiNo', detalle: 'wifi', active: false },
        { nombre: 'Giratorio', tipo: 'selectSiNo', detalle: 'giratorio', active: false },
          { nombre: 'Tipo de rosca', tipo: 'input', detalle: 'tipoRosca', active: false },
        { nombre: 'Control', tipo: 'selectSiNo', detalle: 'control', active: false },
          { nombre: 'Tipo de control', tipo: 'input', detalle: 'tipoControl', active: false }
      ],
      Macetas: [
       { nombre: 'Estilo', tipo: 'input', detalle: 'estilo' },
        { nombre: 'Tipo', tipo: 'select', opciones: [ 'Maceta', 'Macetero'], detalle: 'tipo' },
        { nombre: 'Material', tipo: 'input', detalle: 'material' },
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura' },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho' },
        { nombre: 'Largo', tipo: 'medida', detalle: 'largo', valorSelect: 'unidadMedidaLargo' },
        { nombre: 'Diametro de boca', tipo: 'medida', detalle: 'diametroBoca', valorSelect: 'unidadMedidaDiametroBoca' },
        { nombre: 'Diametro de base', tipo: 'medida', detalle: 'diametroBase', valorSelect: 'unidadMedidaDiametroBase' },
        { nombre: 'Capacidad en volumen', tipo: 'medidaVolumen', detalle: 'volumen', valorSelect: 'unidadMedidaVolumen' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: [ 'Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Sistema autorriego', tipo: 'selectSiNo', detalle: 'sistemaAutorriego' },
        { nombre: 'Es colgante', tipo: 'selectSiNo', detalle: 'colgante' },
        { nombre: 'Incluye plato', tipo: 'selectSiNo', detalle: 'incluyePlato' },
        { nombre: 'Agujeros de drenaje', tipo: 'selectSiNo', detalle: 'agujerosDrenaje' },
        { nombre: 'Apto para huerta', tipo: 'selectSiNo', detalle: 'aptoParaHuerta' },
        { nombre: 'Con planta', tipo: 'selectSiNo', detalle: 'conPlanta' },
        { nombre: 'Tipo de planta', tipo: 'input', detalle: 'tipoPlanta', active: false },
      ],
      Relojes: [
        { nombre: 'Tipo', tipo: 'select', opciones: [ 'Pared', 'Mesa'], detalle: 'tipo' },
        { nombre: 'Estilo', tipo: 'input', detalle: 'estilo' },
        { nombre: 'Material', tipo: 'input', detalle: 'material' },
        { nombre: 'Alimentación', tipo: 'input', detalle: 'alimentacion' },
        { nombre: 'Montaje', tipo: 'input', detalle: 'montaje' },
        { nombre: 'Figura', tipo: 'input', detalle: 'figura' },
        { nombre: 'Diametro', tipo: 'medida', detalle: 'diametro', valorSelect: 'unidadMedidaDiametro' },
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura' },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: [ 'Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Panel', tipo: 'selectSiNo', detalle: 'panel' }, 
        { nombre: 'Tipo de panel', tipo: 'input', detalle: 'tipoPanel', active: false }, 
      ],
      Difusores: [
        { nombre: 'Tipo', tipo: 'select', opciones: [ 'Difusor', 'Humificador'], detalle: 'tipo' },
        { nombre: 'Tecnologia difusion', tipo: 'select', opciones: [ 'Ventilación', 'Ultra sonido', 'Calor', 'Difusión por mecha', 'Nebulización'], detalle: 'tecnologiaDifusion' },
        { nombre: 'Material', tipo: 'input', detalle: 'material' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: ['Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Temporizador', tipo: 'selectSiNo', detalle: 'temporizador' },
        { nombre: 'Luces led', tipo: 'selectSiNo', detalle: 'lucesLed' },
        { nombre: 'Apagado automático', tipo: 'selectSiNo', detalle: 'apagadoAutomatico' },
        { nombre: 'Instrucciones de uso', tipo: 'selectSiNo', detalle: 'instruccionesUso' },
      ],
      Adornos: [
        { nombre: 'Material', tipo: 'input', detalle: 'material' },
        { nombre: 'Tema', tipo: 'input', detalle: 'tema' },
        { nombre: 'Linea', tipo: 'input', detalle: 'linea' },
        { nombre: 'Significado', tipo: 'input', detalle: 'significado' },
        { nombre: 'Altura', tipo: 'medida', detalle: 'altura', valorSelect: 'unidadMedidaAltura' },
        { nombre: 'Ancho', tipo: 'medida', detalle: 'ancho', valorSelect: 'unidadMedidaAncho' },
        { nombre: 'Profundidad', tipo: 'medida', detalle: 'profundidad' , valorSelect: 'unidadMedidaProfundidad' },
        { nombre: 'Formato de venta', tipo: 'select', opciones: [ 'Unidades', 'Pack'], detalle: 'formatoVenta'  },
        { nombre: 'Unidades por pack', tipo: 'number', detalle: 'unidadesPack', active: false },
        { nombre: 'Es coleccionable:', tipo: 'selectSiNo', detalle: 'coleccionable'},
          { nombre: 'Colección', tipo: 'input', detalle: 'coleccion', active: false },
        { nombre: 'Es un personaje', tipo: 'selectSiNo', detalle: 'personaje' },
          { nombre: 'Personaje', tipo: 'input', detalle: 'tipoPersonaje', active: false },
        { nombre: 'Incluye accesorios:', tipo: 'selectSiNo', detalle: 'incluyeAccesorios'},
        { nombre: 'Es articulada:', tipo: 'selectSiNo', detalle: 'articulada'},
        { nombre: 'Piezas intercambiables?:', tipo: 'selectSiNo', detalle: 'piezasIntercambiables'}
      ],
    };

    this.detalles = detalles[this.pasos.producto.categoria]; // asignamos a detalles los detalles según su categoría
    if(!this.pasos.producto.detalles){ //Si ya existon los detalles, se asignarán a sus inputs y selects
      this.asignarNuevosFormControls();
    }else{
      this.asignarDatosInputs();
    }
  }

  asignarNuevosFormControls(){ //crear form controls y datos (nuevos)
    this.detalles.forEach(detalle => {
      if(detalle.valorSelect){
        if(detalle.tipo == 'medida'){
          this.form.addControl(detalle.valorSelect, this.formBuilder.control('cm'));
        }
        if(detalle.tipo == 'medidaVolumen'){
          this.form.addControl(detalle.valorSelect, this.formBuilder.control('L'));
        }
        if(detalle.tipo == 'medidaPeso'){
          this.form.addControl(detalle.valorSelect, this.formBuilder.control('Kg'));
        }
        if(detalle.tipo == 'medidaPotencia'){
          this.form.addControl(detalle.valorSelect, this.formBuilder.control('W'));
        }
        if(detalle.tipo == 'medidaTemperatura'){
          this.form.addControl(detalle.valorSelect, this.formBuilder.control('K')); //--
        }
      }
      if(detalle.tipo == 'selectSiNo'){
        this.form.addControl(detalle.detalle, this.formBuilder.control('No'));
      }
      this.form.addControl(detalle.detalle, this.formBuilder.control(''));
    });
  }

  asignarDatosInputs(){
    //----------------- Asignar datos ya existentes ------------------------
    const detallesProd = this.pasos.producto.detalles;

    for (const clave in detallesProd) {
      if (detallesProd.hasOwnProperty(clave)) {
        const valor = detallesProd[clave];
        this.form.addControl(clave, this.formBuilder.control(valor));
      }
    }

    //----------------- mostrarInputsSecundarios segun datos ya existentes ------------------------
    if(this.pasos.producto.categoria == 'Iluminacion'){
      this.mostrarSubCategoria(this.form.value['subCategoria']);
    }

    if(this.form.value['formatoVenta'] == 'Pack'){ //Input general 
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'unidadesPack') {
          objeto.active = true;
        }
      });
    }

    if(this.form.value['conPlanta'] == 'Sí'){ //categoría Macetas
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'tipoPlanta') {
          objeto.active = true;
        }
      });
    }
    if(this.form.value['panel'] == 'Sí'){ //categoría Macetas
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'tipoPanel') {
          objeto.active = true;
        }
      });
    }
    if(this.form.value['marco'] == 'Sí'){ //categoría Macetas
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'materialMarco') {
          objeto.active = true;
        }
      });
    }
    if(this.form.value['coleccionable'] == 'Sí'){ //categoría Adornos
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'coleccion') {
          objeto.active = true;
        }
      });
    }
    if(this.form.value['personaje'] == 'Sí'){ //categoría Adornos
      this.detalles.forEach((objeto) => {
        if (objeto.detalle === 'tipoPersonaje') {
          objeto.active = true;
        }
      });
    }
  }

  selectFormatoVenta(i: number, event: Event){
    const value = (event.target as HTMLSelectElement).value;
    if(value === 'Pack'){
      this.detalles[i + 1].active = true;
    }else{
      this.detalles[i + 1].active = false;
    }
  }

  inputSecundarioSiNo(event: Event, cambiar: string){
    const value = (event.target as HTMLSelectElement).value;
    this.detalles.forEach( detalle =>{
      if(detalle.detalle == cambiar){
        if(value == 'Sí'){
          detalle.active = true;
        }else{
          detalle.active = false;
        }
      }
    })
  }

  selectSubCategoria(event: Event){ // CATEGORIA ILUMINACIÓN --------------------
    const value = (event.target as HTMLSelectElement).value;
    this.mostrarSubCategoria(value);
  }

  mostrarSubCategoria(value: string){ // CATEGORIA ILUMINACIÓN --------------------
    this.detalles.forEach( detalle =>{
      if(detalle.detalle !== 'tecnologiaIluminacion' && detalle.detalle !== 'subCategoria'){
        detalle.active = false;
      }
    })

    if(value === 'Bombillos'){
      this.detalles.forEach( detalle =>{
        if(detalle.detalle == 'potencia' || detalle.detalle == 'temperaturaColor' || detalle.detalle == 'forma' || detalle.detalle == 'sistemasOperativosCompatibles' || detalle.detalle == 'apliacionesCompatibles' || detalle.detalle == 'wifi' || detalle.detalle == 'giratorio' || detalle.detalle == 'formatoVenta'){
          detalle.active = true;
        }
        if(this.form.value['giratorio'] == 'Sí'){
          this.detalles[25].active = true; 
        }
      })
    }else if(value === 'Lamparas'){
      this.detalles.forEach( detalle =>{
        if(detalle.detalle == 'tipo' || detalle.detalle == 'estilo' || detalle.detalle == 'material' || detalle.detalle == 'potencia' || detalle.detalle == 'inalambrico' || detalle.detalle == 'autoadhesiva' || detalle.detalle == 'regulable' || detalle.detalle == 'controlRemoto' || detalle.detalle == 'sistemaDePresion' || detalle.detalle == 'wifi' || detalle.detalle == 'formatoVenta'){
          detalle.active = true;
        }
      })
    }else if(value === 'Letreros led'){
      this.detalles.forEach( detalle =>{
        if(detalle.detalle == 'diseño' || detalle.detalle == 'altura' || detalle.detalle == 'ancho' ||  detalle.detalle == 'tipoMensaje' || detalle.detalle == 'fuenteAlimentacion' || detalle.detalle == 'montaje' || detalle.detalle == 'control' || detalle.detalle == 'formatoVenta'){
          detalle.active = true;
        }
        if(this.form.value['control'] == 'Sí'){
          this.detalles[27].active = true; 
        }
      })
    }
    if(this.form.value['formatoVenta'] == 'Pack'){
      this.detalles.forEach((objeto) => {
        if(objeto.detalle === 'unidadesPack'){
          objeto.active = true;
        }
      });
    }else{
      this.detalles.forEach((objeto) => {
        if(objeto.detalle === 'unidadesPack'){
          objeto.active = false;
        }
      });
    }
  }

  submit(): any {
      this.pasos.paso7 = true;
      Object.entries(this.form.value).forEach(([key, value])=>{
        if (typeof value === 'string') {
          this.form.value[key] = value.replace(/\s+/g, ' ').trim();
        }
      })
      this.pasos.producto.detalles = this.form.value;
      this.router.navigate(['/publicar', 'formulario', 'paso7']);
  }

  atras(): void {
    this.pasos.producto.detalles = this.form.value;
    this.router.navigate(['/publicar', 'formulario', 'paso5']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
