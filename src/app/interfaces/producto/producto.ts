import { DocumentData, DocumentReference, Timestamp } from "@angular/fire/firestore";

export interface Producto {
  //--------------------------------------------------------------
  id?: string, 
  idUsuario: string, 

//------------------------ FORMULARIO -----------
  categoria: string, 

  nombre: string,

  autoria: string,
  marca: string,       /*--- Principales ---*/
  modelo: string,

  fotos: string[],   /*--- visual ---*/
  conSabor: boolean;
  sabor?: string;
  sabores?: string[];
  tamanios?: Tamanio[];
  subCategoria?: string;
  soloPorHoy?: boolean;
  masVendido: boolean;
  colores?: {fotos:string[], color: string }[];
  estilos?: Estilo[];
  videos?: {titulo: string, url: string}[];
  
  detalles: string[],

  descripcion?: string,

  precio: number,  

  envioGratis: boolean,

  tipoPublicacion: string,

  fecha: Timestamp;

//-----------------
  precioEnvio?: number,
  vistas: Vistas[],
  descuento?: boolean, 
    precioComparacion?: number,
  opiniones: Opinion[],
    calificacion?: number,

  ventas: number, // No es necesario agregar la referencias, ya que no necesito los datos de las ventas aquí
  estado?: boolean
}

export interface Opinion {
  tituloProducto: string,
  foto: string,
  calificacion?: number,
  fecha: Timestamp,
  contenido?: string,
  check: boolean
}

export interface Tamanio {
  gramos: string,
  precio: number,
  seleccion: boolean
}

export interface Estilo {
  id?: string,
  fotos: string[],
  estilo: string,
  nombre?: string,
  unidades?: number,
  sku?: string
}

interface Vistas{
  fecha: Timestamp,
  cantidad: number
}