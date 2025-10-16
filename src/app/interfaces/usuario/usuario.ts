import { Opinion } from "../producto/producto";

import { Dinero } from "./subInterfaces/dinero";
import { ReporteReclamo } from "./subInterfaces/reporte-reclamo";
import { Facturacion } from "./subInterfaces/facturacion";
import { Notificacion, NotificacionesRecibidas } from "./subInterfaces/notificacion";
import { AtencionCliente } from "./subInterfaces/atencion-cliente";
import { DocumentData, DocumentReference } from "@angular/fire/firestore";
import { Direccion } from "./subInterfaces/direccion";
import { EmailsConfiguracion } from "./subInterfaces/emails-configuracion";
import { Ticket } from "../ticket";

export interface Usuario {
  //------------- perfil -------------- //
  id?: string;
  usuario: string;
  nombre: string;
  correo: string;
  telefono: number;
  seguidores: number;
  registroHistorial: boolean,
  fechaRegistro: Date,
  diasComoVendedor?: number,
  direcciones?: Direccion[] | [],
  documento?: number,
  tipoDocumento?: string,
  tickets?: DocumentReference<DocumentData>[],
  reportes?: reportes,
  //------------------------------------------- 
  dinero: Dinero; 
  //-------------
  reportesreclamos?: ReporteReclamo[]; //---- Falta
  //------------- 
  ventas?: DocumentReference<DocumentData>[]; //Cambiado 
  //------------- 
  compras?: DocumentReference<DocumentData>[]; //Cambiado 
  //------------- 
  favoritos?: DocumentReference<DocumentData>[];
  //------------- 
  opiniones?: Opinion[]; 
  //------------- 
  publicaciones?: DocumentReference<DocumentData>[]; 
  //-------------
  novedades?: DocumentReference<DocumentData>[];
  //-------------
  facturacion?: Facturacion;
  //-------------
  notificaciones?: Notificacion[];
  notificacionesRecibidas: NotificacionesRecibidas;
  emailsRecibidos: EmailsConfiguracion;
  //-------------
  atencionCliente?: AtencionCliente[]; //--- Falta
  //---------------------------------------------
  referenciaCompra?: referenciaCompra[]; //-- nueva
  carrito?: referenciaCompra[];
  guardados?: referenciaCompra[];
  historial?: DocumentReference<DocumentData>[];
  siguiendo?: string[];

}

interface reportes {
  atencionCliente?: number,
  publicacion?: number
}

export interface porComprar{
  idProducto: string,
  tituloProducto: string,
  precioProducto: number,
  nombreEstilo: string,
  idEstilo: string,
  skuEstilo: string,
  foto: string,
  unidades: number,
  gramosTamanio: string,
  envioGratis: boolean,
  precioEnvio: number
}

export interface referenciaCompra {
  producto: DocumentReference<DocumentData>;
  estilo: string;
  unidades: number;
  tamanioIndex?: number
}
