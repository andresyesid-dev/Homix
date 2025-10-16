import { Component, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { matAddAPhotoRound } from '@ng-icons/material-icons/round';
import { ionCloseCircleSharp } from '@ng-icons/ionicons';
import { ionCloseCircleOutline } from '@ng-icons/ionicons'; 
import { matCheck } from '@ng-icons/material-icons/baseline';

import { DocumentData, DocumentReference, Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, StorageReference, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { EditarEstilosPublicacionService } from 'src/app/servicios/perfil/editar-estilos-publicacion.service';
import { Subscription } from 'rxjs';
import { Estilo, Producto } from 'src/app/interfaces/producto/producto';
import { Auth } from '@angular/fire/auth';
import { ProductosService } from 'src/app/servicios/productos/productos.service';

@Component({
  selector: 'app-fotos',
  templateUrl: './fotos.component.html',
  styleUrls: ['./fotos.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, matAddAPhotoRound, ionCloseCircleSharp, ionCloseCircleOutline, matCheck})]
})
export class FotosComponent implements OnDestroy{
  constructor(private firestore: Firestore, private storage: Storage, private auth: Auth, private editarEstilosService: EditarEstilosPublicacionService, private prodService: ProductosService) {}
  subscription!: Subscription;
  @Output() nuevosDatos = new EventEmitter<void>();
  @Input() tipoPublicacion!: string;
  private estilosProducto!: any;
  private estilosProductoCopy!: any; //Para eliminar fotos de aquí, y no del original
  @Input() productoId!: string;
  submitValue = false;
  estilos!: Estilo[] | any;
  fotosFiles!: ((File | string)[])[];

  fotosPorEliminarStorage!: string[];
  estilosPorEliminarStorage!: string[];
  estilosRef!: DocumentReference<DocumentData>[];

  cargando = false;
  actualizacionExitosa = false;
  
  async ngOnInit() {
    this.obtenerDatos();
  }
  obtenerDatos(){
    this.subscription = this.editarEstilosService.estilos.subscribe(async (valor) => {
      this.estilosProducto = valor;
      this.estilosProductoCopy = valor;
      if(this.estilosProducto) {
        this.estilos = [];
        this.fotosFiles = [];
        this.fotosPorEliminarStorage = [];
        this.definirEstilos(this.estilosProducto);
        await this.obtenerFotos();
        this.validarCampos();
      }
    });
  }

  definirEstilos(estilos: any){
    estilos.forEach((element: any) => {
      this.estilos.push({
        nombre: element.nombre, 
        fotos: ['','','','',''],
        unidades: '',
        sku: ''
      })
      this.fotosFiles.push(['', '', '', '', '']);
    });
  }

  async obtenerFotos(){
    const estilosFirestore = this.estilosProducto.map(async (estilo:any, index: number) => {
      let object!: any;
      if(estilo.id){
        let fotos = await Promise.all(estilo.fotos.map((fotoRef: any)=>{
          const bucket = ref(this.storage, `productos/${this.productoId}/${estilo.id}/${fotoRef.id}`); 
          return getDownloadURL(bucket);
        }))

        if(fotos.length >= 5 && fotos.length <= 9){
          fotos.push('');
        }
        
        let faltantes = Math.max(0, 5 - fotos.length);
        fotos = fotos.concat(new Array(faltantes).fill(''));
        object = {
          nombre: estilo.nombre,
          fotos: fotos,
          unidades: estilo.unidades,
          sku: estilo.sku ? estilo.sku : ''
        }
      }else{
        object = {
          nombre: estilo.nombre,
          fotos: ['','','','',''],
          unidades: '',
          sku: ''
        }
      }
      return object;
    });
    this.estilos = await Promise.all(estilosFirestore);
  }

  //-------------------------------- FUNCIONES SUBMIT -------------------------------

  async submit() {
    try {
      this.cargando = true;
      await this.estilosPorEliminar();
      await this.definirEstilosFirestore();
      //subirProductoFirestore.
      await this.subirFotos();
      await this.eliminarFotosFirestore();
      this.nuevosDatos.emit();
      this.actualizacionExitosa = true;
      setTimeout(()=>{
        this.cargando = false;
        this.actualizacionExitosa = false;
        this.submitValue = false;
      }, 1500);
      setTimeout(()=>{
        this.cargando = false;
        this.actualizacionExitosa = false;
        this.submitValue = false;
      }, 1500);
    } catch (error) {
      console.log("Hubo un error", error);
    }
  }

  //- 1 -------------------------
  async estilosPorEliminar(){
    const productoSnapshot = await getDoc(doc(this.firestore, `productos/${this.productoId}`));
    const producto = productoSnapshot.data() as Producto;
    let idsEstilos = this.estilosProducto.map((estilo: any) => estilo.id);
    let idsEstilosFirestore = producto.estilos?.map((estilo: any) => estilo.id) || [];
    this.estilosPorEliminarStorage = idsEstilosFirestore.filter(id => !idsEstilos.includes(id));
  }

  //- 2 -------------------------
  async definirEstilosFirestore(){
    const estilosAdd = this.estilos.filter((estilo: Estilo, index: number) => !this.estilosProducto[index].hasOwnProperty('id')).map((estilo: Estilo) => {
      return {
        nombre: estilo.nombre,
        unidades: Number(estilo.unidades),
        sku: estilo.sku
      };
    });

    const estilosUpdate = this.estilos.filter((estilo: Estilo, index: number) => this.estilosProducto[index].hasOwnProperty('id')).map((estilo: Estilo) => {
      return {
        nombre: estilo.nombre,
        unidades: Number(estilo.unidades),
        sku: estilo.sku
      };
    });
    await this.subirProductoFirestore(estilosUpdate, estilosAdd)
  }

  //- 3 -------------------------
  async subirProductoFirestore(estilosUpdate: Estilo[], estilosAdd: Estilo[]): Promise<void>{
    //Agregar, actualizar estilos
    const estilosUpRef = await this.actualizarEstilos(estilosUpdate);
    const estilosAddRef = await this.subirEstilos(estilosAdd);
    this.estilosRef = estilosUpRef.concat(estilosAddRef);

    await updateDoc(doc(this.firestore, `productos/${this.productoId}`), {estilos: this.estilosRef})
  }

  async actualizarEstilos(estilos: Estilo[]){
    return Promise.all(estilos.map(async (estilo: Estilo, index: number)=>{
      const estiloRef = doc(this.firestore, `productos/${this.productoId}/estilos/${this.estilosProducto[index].id}`);
      await setDoc(estiloRef, estilo, {merge: true})
      return estiloRef
    }))
  }

  subirEstilos(estilos: Estilo[]){
    return Promise.all(estilos.map(async (estilo: Estilo)=>{
      return await addDoc(collection(doc(this.firestore, `productos/${this.productoId}`), "estilos"), estilo);
    }))
  }

  //- 4 -------------------------

  async subirFotos(){
    const productoRef = doc(this.firestore, `productos/${this.productoId}`);

    let fotosAgregadasPorEstilo = this.fotosFiles.map(subArray => subArray.filter(elemento => elemento instanceof File));

    const fotosRef = await Promise.all(this.estilosRef.map(async (referencia: any, index: number) => {
      let estiloFotosRefs!:DocumentReference<DocumentData>[];

      if(this.estilosProducto[index].hasOwnProperty('id')){
        const estiloRef = doc(this.firestore, `productos/${this.productoId}/estilos/${this.estilosProducto[index].id}`);
        const estiloSnapshot = await getDoc(estiloRef);
        const estilo = estiloSnapshot.data() as Estilo;
        let fotosRef: any = estilo.fotos;
        let fotosRefNuevas: DocumentReference<DocumentData>[] = [];
        await Promise.all(fotosAgregadasPorEstilo[index].map(async (foto:any) => {
          const fotoRef = await addDoc(collection(referencia, "fotos"), { url: '' });
          fotosRef.push(fotoRef); //Agregar nuevas fotos a array ref fotos existentes
          fotosRefNuevas.push(fotoRef); //agregar nuevas fotos a array
        }));
        await updateDoc(referencia, {fotos: fotosRef}) //Actualizar a fotos antiguas más las fotos recientes.
        estiloFotosRefs = fotosRefNuevas;
      }else{
        estiloFotosRefs = await Promise.all(fotosAgregadasPorEstilo[index].map(async (foto:any) => {
          const fotoRef = await addDoc(collection(referencia, "fotos"), { url: '' });
          return fotoRef
        })); 
        await updateDoc(referencia, {fotos: estiloFotosRefs})
      }
    
      return estiloFotosRefs
    })) as DocumentReference<DocumentData>[][];

    let fotosRefStorage: StorageReference[] = [];
    await Promise.all(this.estilosRef.map(async (referencia: any, i: number) => {
      return await Promise.all(fotosAgregadasPorEstilo[i].map(async (foto: any, index: number) => {
        const storageRef = ref(this.storage, `productos/${productoRef.id}/${referencia.id}/${fotosRef[i][index].id}`);
        await uploadBytes(storageRef, foto);
        fotosRefStorage.push(storageRef);
      }));
    })); 
    
    const fotosLinks = await Promise.all(fotosRefStorage.map(async (fotoStorageRef: any, i: number) => {
      return getDownloadURL(fotoStorageRef);
    })); 

    await Promise.all(fotosRef.flat().map(async (docRef: DocumentReference<DocumentData>, i: number) => {
      return await updateDoc(docRef, { url: fotosLinks[i] });
    }));
  }

  //- 5 -------------------------
  async eliminarFotosFirestore(){

    await this.estilosPorEliminarStorage.reduce(async (previousPromise, idEstilo) => {
      await previousPromise;
      let estiloRef = doc(this.firestore, `productos/${this.productoId}/estilos/${idEstilo}`);
      let fotosRef = collection(this.firestore, `productos/${this.productoId}/estilos/${idEstilo}/fotos`);
      const fotosSnapshot = await getDocs(fotosRef);
      fotosSnapshot.forEach((docEstilo) => {
        let fotoRef = doc(this.firestore, `productos/${this.productoId}/estilos/${idEstilo}/fotos/${docEstilo.id}`);
        deleteDoc(fotoRef);
      });
  
      await deleteDoc(estiloRef);
    }, Promise.resolve());

    await this.fotosPorEliminarStorage.reduce(async (previousPromise, rutaFoto) => {
      await previousPromise;
      let [idEstilo, idFoto] = rutaFoto.split('/');
      let fotoRef = doc(this.firestore, `productos/${this.productoId}/estilos/${idEstilo}/fotos/${idFoto}`);
      await deleteDoc(fotoRef);
      const estiloRef = doc(this.firestore, `productos/${this.productoId}/estilos/${idEstilo}`);
      const estiloSnapshot = await getDoc(estiloRef);
      let estilo = estiloSnapshot.data() as Estilo;
      estilo.fotos = estilo.fotos.filter((ref:any) => ref.id !== fotoRef.id);
      await updateDoc(estiloRef, {fotos: estilo.fotos});
    }, Promise.resolve());
    
  }

//--------------------------------------------------------- Funciones de agregar, eliminar. -----------------------------------------------
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
            this.fotosFiles[i][index] = file;
            if(index >= 4 && index < 7){
              this.estilos[i].fotos.push('');
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
    },10);
  }

  eliminarFoto(i: number, index: number){
    this.estilos[i].fotos.splice(index, 1);
    this.fotosFiles[i].splice(index, 1);
    if(this.estilos[i].fotos.length <= 4){
      this.estilos[i].fotos.push('');
      this.fotosFiles[i].push('');
    }
    this.validarCampos();
    if(this.estilosProductoCopy[i].hasOwnProperty('id')){
      if(this.estilosProductoCopy[i].fotos[index] !== undefined){
        this.fotosPorEliminarStorage.push(`${this.estilosProducto[i].id}/${this.estilosProducto[i].fotos[index].id}`);
        this.estilosProductoCopy[i].fotos.splice(index, 1);
        console.log(this.estilosProductoCopy);
      }
    }
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

  ngOnDestroy(): void {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      if (this.cargando) {
          $event.returnValue = true;
      }
  }

}
