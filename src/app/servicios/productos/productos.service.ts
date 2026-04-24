import { Injectable } from '@angular/core';
import { DocumentData, DocumentReference, Firestore, arrayUnion, collection, doc, docData, getDoc, getDocs, increment, orderBy, query, setDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, getDownloadURL, listAll, ref } from '@angular/fire/storage';
import { Observable, map } from 'rxjs';
import { Estilo, Producto } from 'src/app/interfaces/producto/producto';
import { Usuario } from 'src/app/interfaces/usuario/usuario';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  constructor(private firestore: Firestore, private storage: Storage) { }

  async obtenerProductos(): Promise<Producto[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'productos'));
    const productos:Producto[] = [];
  
    querySnapshot.forEach((doc) => {
      const producto = doc.data() as Producto;
      producto['id'] = doc.id;
      if(producto['estado']){
        productos.push(producto);
      } 
    });
    
    return productos;
  }

  async obtenerFotos(productos: Producto[]): Promise<string[]>{
    return Promise.all(productos.map(async (producto:any) => {
      // Verificar si usa el formato antiguo (DocumentReference) o nuevo (string[])
      if (producto.estilos && Array.isArray(producto.estilos) && typeof producto.estilos[0] === 'object' && producto.estilos[0].path) {
        // Formato antiguo: estilos como DocumentReference
        const estiloSnapshot = await getDoc(producto.estilos[0]);
        const estilo = await estiloSnapshot.data() as any;
        const fotoRef = estilo.fotos[0];
        const imgRef = ref(this.storage, `productos/${producto.id}/${producto.estilos[0].id}/${fotoRef.id}`);
        return await getDownloadURL(imgRef);
      } else if (producto.fotos && Array.isArray(producto.fotos) && producto.fotos.length > 0) {
        // Formato nuevo: fotos como array de strings en el producto principal
        return `assets/img/productos/${producto.fotos[0]}.webp`;
      }
      return '';
    }));
  }

  async obtenerFotosSegunEstilo(productos: Producto[], estilos: string[]): Promise<string[]>{
    return Promise.all(productos.map(async (producto:any, index: number) => {
      if (producto.estilos && typeof producto.estilos[0] === 'object' && producto.estilos[0].path) {
        // Formato antiguo
        const estiloRef = doc(this.firestore, `productos/${producto.id}/estilos/${estilos[index]}`);
        const estiloSnapshot = await getDoc(estiloRef);
        const estilo = estiloSnapshot.data() as any;
        const imgRef = ref(this.storage, `productos/${producto.id}/${estilos[index]}/${estilo.fotos[0].id}`);
        return await getDownloadURL(imgRef);
      } else {
        // Formato nuevo
        return `assets/img/productos/${producto.fotos[0]}.webp`;
      }
    }));
  }

  async obtenerFotosProducto(producto: Producto): Promise<string[][]>{
    // Verificar si usa el formato antiguo o nuevo
    if (producto.estilos && Array.isArray(producto.estilos) && typeof producto.estilos[0] === 'object' && (producto.estilos[0] as any).path) {
      // Formato antiguo: estilos como DocumentReference
      return Promise.all(producto.estilos.map(async (estiloRef: any)=>{
        const estiloSnapshot = await getDoc(estiloRef);
        const estilo = estiloSnapshot.data() as any;
        return Promise.all(estilo.fotos.map(async (urlRef: any)=>{
          const imgRef = ref(this.storage, `productos/${producto.id}/${estiloRef.id}/${urlRef.id}`);
          return await getDownloadURL(imgRef);
        }))
      }))
    } else if (producto.fotos && Array.isArray(producto.fotos)) {
      // Formato nuevo: fotos simples en el producto
      return [producto.fotos.map(foto => `assets/img/productos/${foto}.webp`)];
    }
    return [[]];
  }

  async cargarEstilosCompletos(producto: Producto): Promise<void> {
    // Verificar si los estilos son referencias de Firestore (formato antiguo)
    if (producto.estilos && Array.isArray(producto.estilos) && typeof producto.estilos[0] === 'object' && (producto.estilos[0] as any).path) {
      // Cargar datos completos de cada estilo desde Firestore
      const estilosCompletos = await Promise.all(producto.estilos.map(async (estiloRef: any) => {
        const estiloSnapshot = await getDoc(estiloRef);
        const estiloData = estiloSnapshot.data() as any;
        
        // Obtener las URLs de las fotos
        const fotosUrls = await Promise.all(estiloData.fotos.map(async (urlRef: any) => {
          const imgRef = ref(this.storage, `productos/${producto.id}/${estiloRef.id}/${urlRef.id}`);
          return await getDownloadURL(imgRef);
        }));
        
        // Retornar el objeto Estilo completo
        return {
          fotos: fotosUrls,
          estilo: estiloData.estilo || estiloData.nombre || '',
          nombre: estiloData.nombre,
          unidades: estiloData.unidades
        };
      }));
      
      // Actualizar el producto con los estilos completos
      producto.estilos = estilosCompletos as any;
    }
  }

  async obtenerProductosSimilares(categoria: string, idProducto: string): Promise<Producto[]> {
    const queri = query(collection(this.firestore, 'productos'), orderBy('enFavorito', 'desc'));
    const snapshot = await getDocs(queri);
    const productos = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Producto));
    let filtro = productos.filter(producto => producto.categoria == categoria && producto.id !== idProducto);
    return filtro;
  }

  obtenerProductoId(id: string): Observable<Producto | null> {
    const documentoProducto = doc(this.firestore, 'productos', id);
    return docData(documentoProducto).pipe(
      map(producto => {
        if (producto) {
          return { ...producto, id: id } as Producto;
        } else {
          return null;
        }
      })
    );
  }

  async obtenerProductoIdPromise(id: string): Promise<Producto | null> {
    const productoRef = doc(this.firestore, 'productos', id);
    const productoSnapshot = await getDoc(productoRef);
    let prd = productoSnapshot.data() as Producto;
    if(prd){
      prd['id'] = productoSnapshot.id;
      return prd
    }else{
      return null
    }
  }
  
  async obtenerFotoUno(producto: any): Promise<string[]>{
    return this.obtenerFotoPorEstilo(producto, 0);
  }

  async obtenerFotoPorEstilo(producto: any, estiloIndex: number): Promise<string[]>{
    const urlsArrays: string[] = [''];
    
    // Verificar si usa el formato antiguo (DocumentReference) o nuevo (string[])
    if (producto.estilos && Array.isArray(producto.estilos) && typeof producto.estilos[0] === 'object' && producto.estilos[0].path) {
      // Formato antiguo: estilos con subcolección
      const estiloRef = producto.estilos[estiloIndex] ?? producto.estilos[0];
      const estiloSnapshot = await getDoc(estiloRef);
      const estilo = await estiloSnapshot.data() as any;
      const imgRef = ref(this.storage, `productos/${producto.id}/${estiloRef.id}/${estilo.fotos[0].id}`);
      urlsArrays[0] = await getDownloadURL(imgRef);
    } else if (producto.fotos && Array.isArray(producto.fotos) && producto.fotos.length > 0) {
      // Formato nuevo: fotos simples
      urlsArrays[0] = `assets/img/productos/${producto.fotos[0]}.webp`;
    }
    
    return urlsArrays;
  }

  async agregarFavorito(productoId: string, usuarioId: string){
    const usuarioRef = doc(this.firestore, `usuarios/${usuarioId}`);
    const productoRef = doc(this.firestore, `productos/${productoId}`);
    await updateDoc(usuarioRef, {favoritos: arrayUnion(productoRef)});
    await updateDoc(productoRef, {enFavorito: increment(1)})
  }

  async eliminarFavorito(usuarioId: string, favoritos: Usuario['favoritos'], productoRef:  DocumentReference<DocumentData>){
    const usuarioRef = doc(this.firestore, `usuarios/${usuarioId}`);
    await setDoc(usuarioRef, {favoritos: favoritos}, {merge: true});
    await updateDoc(productoRef, {enFavorito: increment(-1)});
  }

  async eliminarCarrito(usuarioId: string, carrito: Usuario['carrito']){
    const usuarioRef = doc(this.firestore, `usuarios/${usuarioId}`);
    await setDoc(usuarioRef, {carrito: carrito}, {merge: true});
  }

  async agregarHistorial(productoId: string, usuarioId: string, historial: any[]){
    const usuarioRef = doc(this.firestore, `usuarios/${usuarioId}`);
    const productoRef = doc(this.firestore, `productos/${productoId}`);

    if(historial){
      const index = historial.findIndex( ref => ref.id === productoId);
      if (index !== -1) {
        historial.splice(index, 1);
        historial.push(productoRef);
      } else {
        historial.push(productoRef);
      }
      await updateDoc(usuarioRef, {
        historial: historial
      })
    }else{
      await updateDoc(usuarioRef, {
        historial: arrayUnion(productoRef)
      })
    }
  }

  async eliminarProducto(productoId: string, usuarioId: string, publicaciones: DocumentReference[]): Promise<void> {
    try {
      // 1. Actualizar estado del producto en lugar de eliminarlo físicamente
      const productoRef = doc(this.firestore, `productos/${productoId}`);
      await updateDoc(productoRef, {
        estado: false,
        fechaEliminacion: new Date()
      });

      // 2. Eliminar la referencia del producto del array de publicaciones del usuario
      const publicacionesActualizadas = publicaciones.filter(ref => ref.id !== productoId);
      const usuarioRef = doc(this.firestore, `usuarios/${usuarioId}`);
      await updateDoc(usuarioRef, {
        publicaciones: publicacionesActualizadas
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return Promise.reject(error);
    }
  }

}
