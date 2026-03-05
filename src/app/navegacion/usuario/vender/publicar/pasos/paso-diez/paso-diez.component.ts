import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PasosVenderService } from '../../../../../../servicios/vender/vender.service';
import { provideIcons } from '@ng-icons/core';
import { heroArrowSmallLeft } from '@ng-icons/heroicons/outline';
import { ionCheckmarkSharp } from '@ng-icons/ionicons';
import { ionInformationCircleOutline } from '@ng-icons/ionicons';
import { aspectsInformation } from '@ng-icons/ux-aspects';
import { Estilo, Producto } from 'src/app/interfaces/producto/producto';
import { DocumentData, DocumentReference, Firestore, addDoc, arrayUnion, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { ref, uploadBytes, Storage, getDownloadURL } from '@angular/fire/storage';
import { Auth, user } from '@angular/fire/auth';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { listAll } from 'firebase/storage';

@Component({
  selector: 'app-paso-diez',
  templateUrl: './paso-diez.component.html',
  styleUrls: ['./paso-diez.component.scss'],
  providers: [provideIcons({heroArrowSmallLeft, ionCheckmarkSharp, ionInformationCircleOutline, aspectsInformation})]
})
export class PasoDiezComponent implements OnInit{
  constructor( private pasos: PasosVenderService, private router: Router, private firestore: Firestore, private storage: Storage, private auth: Auth) {}
  private productoRef!: DocumentReference<DocumentData>
  submitValue = false;
  gratuito = false;
  basico = false;
  premium = false;

  precioBasico!: number;
  precioPremium!: number;

  cargando = false; //Barra de carga

  gratuita = true;
  verDetalles = false;

  fotos!: any[][];
  estilos!: any[];
  estilosRef!: DocumentReference<DocumentData>[];
  primerFotoProducto!: string;

  ngOnInit(): void {
    this.pasos.paso7 ? this.definirPrecios() : this.router.navigate(['/publicar', 'formulario', 'paso6']);
  }

  definirPrecios(){
    const estilos = this.pasos.producto.estilos;
    if(estilos.length > 1 || estilos[0].unidades > 1){
      this.gratuita = false;
    }
    if(this.pasos.producto){
      if(this.pasos.producto.tipoPublicacion){
        if(this.pasos.producto.tipoPublicacion == 'gratuita'){
          this.gratuito = true;
        }else if(this.pasos.producto.tipoPublicacion == 'basica'){
          this.basico = true;
        }else if(this.pasos.producto.tipoPublicacion == 'premium'){
          this.premium = true;
        }
        this.submitValue = true;
      }
    }
    this.precioBasico = this.pasos.producto.precio * 0.08;
    this.precioPremium = this.pasos.producto.precio * 0.12;
  }

  cambiarPlan(plan: string){
    if(plan === "gratuito"){
      this.gratuito = true;
      this.basico = false;
      this.premium = false;
    }else if(plan === "basico"){
      this.gratuito = false;
      this.basico = true;
      this.premium = false;
    }else if(plan === "premium"){
      this.gratuito = false;
      this.basico = false;
      this.premium = true;
    }
    this.submitValue = true;
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

  tipoPublicacionSeleccionada(){
    if(this.gratuito){
      this.pasos.producto.tipoPublicacion = 'gratuita'
    }else if(this.basico){
      this.pasos.producto.tipoPublicacion = 'basica'
    }else if(this.premium = true){
      this.pasos.producto.tipoPublicacion = 'premium'
    }
  }

  estructurarDetalles(detalles: any): any {
    const unidadesMedida = ['altura', 'ancho', 'diametro', 'diametroBase','diametroBoca', 'largo', 'peso', 'profundidad','volumen', 'potencia', 'temperaturaColor'];
    const bombillos = ['forma', 'sistemasOperativosCompatibles','apliacionesCompatibles', 'giratorio', 'tipoRosca'];
    const lamparas = ['tipo', 'estilo', 'material', 'inalambrico', 'autoadhesiva', 'regulable', 'controlRemoto', 'sistemaDePresion'];
    const letrerosLed = ['diseño', 'altura', 'ancho', 'tipoMensaje','fuenteAlimentacion', 'montaje', 'control', 'tipoControl'];

    //----------------------------------- Eliminar propiedades Vacias ----------------------- //
    for (const clave in detalles) {
      if (detalles.hasOwnProperty(clave) && detalles[clave] === '') {
        delete detalles[clave];
      }
    }

    this.pasos.producto.estilos.forEach((estilo: any, index: any) => {
      for (let i = estilo.fotos.length - 1; i >= 0; i--) {
        if (estilo.fotos[i] === '') {
          this.pasos.producto.estilos[index].fotos.splice(i, 1);
        }
      }
    });

    //----------------------------------- estructurar datos subCategoría ILUMINACIÓN ----------------------- //
    if(detalles.subCategoria === 'Bombillos'){
      for (const dato of lamparas) {
          delete detalles[dato];
      }
      for (const dato of letrerosLed) {
        delete detalles[dato];
      }
    } 
    if(detalles.subCategoria === 'Lamparas'){
      for (const dato of bombillos) {
          delete detalles[dato];
      }
      for (const dato of letrerosLed) {
        delete detalles[dato];
      }
    } 
    if(detalles.subCategoria === 'Letreros led'){
      for (const dato of bombillos) {
          delete detalles[dato];
      }
      for (const dato of lamparas) {
        delete detalles[dato];
      }
      delete detalles['potencia'];
      delete detalles['wifi'];
    } 

    for (const unidad of unidadesMedida) {
      if (!detalles[unidad]) {
        delete detalles[`unidadMedida${unidad.charAt(0).toUpperCase() + unidad.slice(1)}`];
      }
    }
    return detalles;
  }

  definirDetalles(){
    const producto = this.pasos.producto;
    producto.nombre = this.capitalizarNombreProducto(producto.nombre); // Corregir nombre ingresado para mejorar motor de busqueda
    const detalles = this.estructurarDetalles(producto.detalles); //Modificar, eliminar o agregar datos importantes a los detalles
    const estilosFotos = this.definirEstilosFotos(producto);
    this.estilos = estilosFotos.estilos || []; //Definir las fotos y los estilos por separado
    delete producto.estilos;
    producto.detalles = detalles;
    //----- Detalles secundarios -----
    producto.idUsuario = this.auth.currentUser?.uid;
    producto.vistas = 0;
    producto.opiniones = [];
    producto.ventas = 0;
    producto.estado = true;
    producto.fecha = new Date();
    producto.precioEnvio = 10000;
  }

  definirEstilosFotos(producto: any): Producto { //Excluir fotos en Firestore
    this.fotos = [];
    for(let estilo of producto.estilos){
      this.fotos.push(estilo.fotos);
    }

    const productoCopy = JSON.parse(JSON.stringify(producto));
    for(let clave in productoCopy.estilos){
      delete productoCopy.estilos[clave].fotos;
    }
    return productoCopy;
  }

  subirEstilos(estilos: Estilo[], productoId: string){
    return Promise.all(estilos.map(async (estilo: Estilo)=>{
      return await addDoc(collection(doc(this.firestore, `productos/${productoId}`), "estilos"), estilo);
    }))
  }

//---------------------------------------------------------------------------------------------------

  async subirProductoFirestore(): Promise<void>{
    this.cargando = true;
    this.productoRef = await addDoc(collection(this.firestore, "productos"), this.pasos.producto);
    this.estilosRef = await this.subirEstilos(this.estilos, this.productoRef.id);
    await updateDoc(this.productoRef, {estilos: this.estilosRef})

    const userRef = doc(this.firestore, "usuarios", this.auth.currentUser?.uid!);
    // Obtén el documento actual
    const snapshot = await getDoc(userRef);
    const usuario = snapshot.data() as Usuario;

    if (!usuario.diasComoVendedor) { //Si no existe agregarla más publicaciones
      await updateDoc(userRef, {
        diasComoVendedor: 0,
        publicaciones: arrayUnion(this.productoRef)
      });
    } else { //Si existe agregar solo publicaciones
      await updateDoc(userRef, {
        publicaciones: arrayUnion(this.productoRef)
      });
    }
    
    await this.subirFotos(this.productoRef);
    await this.agregarNotificacion(userRef, this.productoRef.id);
    this.cargando = false;
  }

  async subirFotos(productoRef: DocumentReference<DocumentData>){

    const fotosRef = await Promise.all(this.estilosRef.map(async (referencia: any, i: number) => {
      const estiloFotosRefs = await Promise.all(this.fotos[i].map(async () => {
        const fotoRef = await addDoc(collection(referencia, "fotos"), { url: '' });
        return fotoRef
      }));
      await updateDoc(referencia, {fotos: estiloFotosRefs})
      return estiloFotosRefs
    })) as DocumentReference<DocumentData>[][];

    const fotosLinks = await Promise.all(this.estilosRef.map(async (referencia: any, i: number) => {
      return await Promise.all(this.fotos[i].map(async (foto: any, index: number) => {
        const storageRef = ref(this.storage, `productos/${productoRef.id}/${referencia.id}/${fotosRef[i][index].id}`);
        await uploadBytes(storageRef, foto);
        return getDownloadURL(storageRef);
      }));
    })); 

    await Promise.all(fotosRef.flat().map(async (docRef: DocumentReference<DocumentData>, i: number) => {
      return await updateDoc(docRef, { url: fotosLinks.flat()[i] });
    }));
    this.primerFotoProducto = fotosLinks.flat()[0];
  }

  async agregarNotificacion(usuarioRef: DocumentReference<DocumentData>, productoId: string){
    await updateDoc(usuarioRef, {
      notificaciones: arrayUnion({
        foto: this.primerFotoProducto,
        titulo: 'Felicidades',
        contenido: `Has publicado un nuevo producto`,
        fecha: new Date(),
        tipo: 'ofertasDecuentos',
        link: `prod/${productoId}`,
        visto: false,
      })
    })
  }

  async submit(): Promise<any> {
    this.tipoPublicacionSeleccionada();
    this.definirDetalles();
    await this.subirProductoFirestore();
    const nombre = this.pasos.producto.nombre;
    this.pasos.restablecerDatos();
    this.pasos.idProducto = this.productoRef.id;
    this.pasos.fotoProducto = this.primerFotoProducto;
    this.pasos.nombre = nombre;
    this.router.navigate(['/publicar/producto-publicado/' + this.productoRef.id]);
  }

  atras(): void {
    this.tipoPublicacionSeleccionada();
    this.router.navigate(['/publicar', 'formulario', 'paso9']);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event: any): void {
      $event.returnValue = true;
  }
}
