import { Component, ElementRef, EventEmitter, Input, Output, QueryList, Renderer2, SimpleChanges, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { PasosVenderService } from 'src/app/servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { ionInformationCircleOutline } from '@ng-icons/ionicons';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { EditarEstilosPublicacionService } from 'src/app/servicios/perfil/editar-estilos-publicacion.service';
import { Estilo } from 'src/app/interfaces/producto/producto';

@Component({
  selector: 'app-estilos',
  templateUrl: './estilos.component.html',
  styleUrls: ['./estilos.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, ionInformationCircleOutline})]
})
export class EstilosComponent {
  constructor( private router: Router, private renderer: Renderer2, private editarEstilosService: EditarEstilosPublicacionService) {}
  @ViewChildren('estiloInput') estiloInputs!: QueryList<ElementRef>;
  @Input() nuevosEstilos!: Estilo[] | boolean;
  @Input() estilos!: any;
  @Input() categoria!: string;
  @Input() productoId!: string;
  @Input() estilosActualizados!: boolean;
  inputs!: string[];
  estilosSubmit!: any[];
  agregar = true;
  btnSubmit!: boolean;
  estilosErrors: boolean[] = [];
  error = false;
  inf = false;

  descripcion!: string;

  datosCargados = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['estilos'] && changes['estilos'].currentValue) {
      if(!this.datosCargados){
        this.editarEstilosService.cambiarEstilos(this.estilos);
        this.inputs = [];
        this.definirArrays(this.estilos);
        this.ejemplosSegunCategoria();
        this.datosCargados = true;
      }
    }
    if (changes['nuevosEstilos'] && changes['nuevosEstilos'].currentValue) {
      if(changes['nuevosEstilos'].currentValue !== true){
        this.estilos = this.nuevosEstilos;
        this.editarEstilosService.cambiarEstilos(this.estilos);
        this.inputs = [];
        this.definirArrays(this.estilos);
        this.ejemplosSegunCategoria();
      }
    }
  }

  ejemplosSegunCategoria(){
    const categoria = this.categoria;
    if(categoria == 'Cuadros'){
      this.descripcion = "cuadros decorativos. Podrías ofrecer diferentes temas, como 'Naturaleza', 'Arte abstracto' o 'Paisajes'.";
    } else if (categoria == 'Repisas') {
      this.descripcion = "repisas. Podrías ofrecer diferentes colores, como 'Negro', 'Blanco', 'Gris', etc.";
    } else if (categoria == 'Iluminacion') {
      this.descripcion = "lámparas. Podrías ofrecer diferentes colores, como 'Blanco', 'Negro', 'Gris', etc.";
    } else if (categoria == 'Macetas') {
      this.descripcion = "macetas. Podrías ofrecer diferentes diseños únicos, como 'Rosas', 'Leones', 'Gatos', o también puedes ofrecer de diferentes colores.";
    } else if (categoria == 'Relojes') {
      this.descripcion = "relojes. Podrías ofrecer diferentes colores, como 'Blanco', 'Negro', 'Gris', etc.";
    } else if (categoria == 'Difusores') {
      this.descripcion = "difusores. Podrías ofrecer diferentes colores de luz, como 'rojo', 'azul', 'verde', etc.";
    } else if (categoria == 'Vinilos') {
      this.descripcion = "vinilos. Podrías ofrecer diferentes tipos de frases, como 'Frase de motivación', 'Frase de amor', 'Frase graciosa', etc.";
    } else if (categoria == 'Adornos') {
      this.descripcion = "adornos. Podrías ofrecer diferentes diseños, como 'Batman', 'Superman', 'Venom', etc. (En caso de ser figuras de personajes).";
    }
  }

  info(){
    this.inf = false;
  }

  definirArrays(estiloService: any[]){
    if(estiloService){
      this.estilosSubmit = estiloService;
      for(let estilo of estiloService){
        this.inputs.push('');
      }
      if(estiloService[0]){
        this.modificarestilo(0, estiloService[0].nombre);
      }
    }else{
      this.estilosSubmit = [];
    }
  }

  //---------------------------- Se ejecutan con los inputs del formulario ------------

  agregarestilo() {
    if (this.inputs.length <= 7) {
      this.inputs.push('');
      this.estilosSubmit.push({nombre: ''});
      this.agregar = false;
      this.btnSubmit = false;

      setTimeout(() => {
        const lastInput = this.estiloInputs.last.nativeElement;
        this.renderer.selectRootElement(lastInput).focus();
      });
    }
  }

  eliminarestilo(index: number): void {
    this.inputs.splice(index, 1);
    this.estilosSubmit.splice(index, 1);
    this.estilosErrors[index] = false;
    this.actualizarAgregar();
  }
  //--------------------------

  modificarestilo(index: number, valor: any){
    this.actualizarAgregar();
    if (valor.target) {
      const valorInput = this.corregirValorActual(valor.target.value);
      const valorExistente = this.estilosSubmit.find(estilo => estilo.nombre === valorInput);
      if (valorExistente) {
        this.estilosErrors[index] = true;
      }else{
        this.estilosErrors[index] = false;
      }
      this.estilosSubmit[index].nombre = valorInput;
    }

    if(this.estilosErrors.some(error => error == true)){
      this.error = true;
    }else{
      this.error = false;
    }

    const nombres = this.estilosSubmit.map(estilo => estilo.nombre); // Extraer los nombres en un nuevo arreglo


    const conjuntoNombres = new Set(nombres); // Crear un conjunto de nombres donde no hay repetidos
    if (nombres.length === conjuntoNombres.size) {
      // No hay nombres repetidos entre los objetos
      this.estilosErrors.fill(false);
      this.error = false;
    } else {
      this.error = true;
    }


    this.actualizarAgregar();
  }

  actualizarAgregar(): void {
    if(this.estilosSubmit.every(estilo => estilo.nombre.trim() !== '') && this.estilosSubmit.length <= 7 && this.error !== true){
      this.agregar = true;
      if(this.estilosSubmit.length !== 0){
        this.btnSubmit = true
      }else{
        this.btnSubmit = false
      }
    }else{
      this.agregar = false;
      this.btnSubmit = false;
    }
    
    if(this.estilosSubmit.every(estilo => estilo.nombre.trim() !== '') && this.estilosSubmit.length == 8 && this.error !== true){
      this.btnSubmit = true;
    }
  }

  corregirValorActual(valor: string): string{
    const trim = valor.trim();
    const lowerCased = trim.toLowerCase();
    const valorInput = lowerCased.charAt(0).toUpperCase() + lowerCased.slice(1);
    return valorInput;
  }

  corregirArray(){
    this.estilosSubmit = this.estilosSubmit.map(item => {
      const trim = item.nombre.trim();
      const lowerCased = trim.toLowerCase();
      const estilosSubmit = lowerCased.charAt(0).toUpperCase() + lowerCased.slice(1);
      return {nombre: estilosSubmit};
    });
  }

  async submit() {
    this.editarEstilosService.cambiarEstilos(this.estilosSubmit)
  }
}
