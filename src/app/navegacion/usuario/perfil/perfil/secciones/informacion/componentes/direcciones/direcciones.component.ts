import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Direccion } from 'src/app/interfaces/usuario/subInterfaces/direccion';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.scss']
})
export class DireccionesComponent implements OnInit, OnChanges{
  constructor(private auth: Auth, private firestore: Firestore){}
  @Output() mostrarContenido = new EventEmitter<string>(); 
  @Output() editarDireccion = new EventEmitter<number>(); 
  @Output() agregarDireccion = new EventEmitter<void>(); 
  @Input() direcciones!: Direccion[] | undefined;
  direccionesString!: string[];
  subMenu: boolean[] = [];

  ngOnInit(): void {
    if(this.direcciones){
      console.log(this.direcciones)
      this.obtenerDireccionString();
      this.direcciones.forEach(()=>{
        this.subMenu.push(false);
      })
    }else{
      this.direcciones = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['direcciones'] && changes['direcciones'].currentValue){
      this.obtenerDireccionString();
      this.subMenu = [];
      this.direcciones!.forEach(()=>{
        this.subMenu.push(false);
      })
    }
  }

  obtenerDireccionString(){
    this.direccionesString = this.direcciones!.map((direccion)=>{
      const arrayModificado: string[] = direccion.direccion!.map((element, index) => {
        if (index === 2) {
          return `#${element}`;
        } else if (index === 3) {
          if(element !== ''){
            return `- ${element}`;
          }else{
            return ''
          }
        } else {
          return element
        }
      });
  
      return arrayModificado.join(' ');
    })
  }

  async editarContenido(mostrar: string,  accion: string, index?: number){
    if(accion == 'agregar'){
      this.agregarDireccion.emit();
      this.mostrarContenido.emit(mostrar);
    }else if(accion == 'editar'){
      this.mostrarContenido.emit(mostrar);
      if(index || index == 0){
        this.editarDireccion.emit(index);
      }
    }else{
      //eliminar dirección
      this.direcciones!.splice(index!, 1);
      const usuarioRef = doc(this.firestore, `usuarios/${this.auth.currentUser!.uid}`);
      await setDoc(usuarioRef, {direcciones: this.direcciones}, {merge: true});
    }
  }

  desplegarSubMenu(index: number){
    const valor = this.subMenu[index];
    this.subMenu.fill(false);
    this.subMenu[index] = !valor;
  }
}
