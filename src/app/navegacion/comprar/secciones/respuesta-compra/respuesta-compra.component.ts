import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, onSnapshot, Unsubscribe, getDoc, updateDoc, increment, setDoc } from '@angular/fire/firestore';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Usuario, porComprar, referenciaCompra } from 'src/app/interfaces/usuario/usuario';
import { Producto } from 'src/app/interfaces/producto/producto';

@Component({
  selector: 'app-respuesta-compra',
  templateUrl: './respuesta-compra.component.html',
  styleUrls: ['./respuesta-compra.component.scss']
})
export class RespuestaCompraComponent implements OnInit, OnDestroy {
  estadoPago: any = null;
  usuario: Usuario | null = null;
  esPSE: boolean = false;
  esEfecty: boolean = false;
  creandoVenta: boolean = false;
  ventaCreada: boolean = false;
  private paymentSubscription: Unsubscribe | null = null;
  private grupoReferencias: { [idVendedor: string]: porComprar[] } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private authService: AuthService,
    private comprarService: ComprarService,
    private firestore: Firestore
  ) {}

  async ngOnInit(): Promise<void> {
    // Obtener usuario actual con todas sus referencias de compra
    if (this.auth.currentUser) {
      this.usuario = await this.authService.getUsuarioIdPromise(this.auth.currentUser.uid);
      console.log('👤 Usuario cargado:', {
        id: this.usuario?.id,
        tieneReferencias: !!this.usuario?.referenciaCompra?.length
      });
    } else {
      console.warn('⚠️ No hay usuario autenticado');
    }

    // Obtener parámetros de la URL (respuesta de MercadoPago)
    this.route.queryParams.subscribe(params => {
      // Si hay parámetros en la URL, usarlos (prioridad)
      if (params['status']) {
        this.estadoPago = {
          payment_id: params['payment_id'] || null,
          status: params['status'],
          payment_method: params['payment_type'] || null,
          transaction_amount: params['transaction_amount'] || null,
          error_message: params['error'] || null,
          mensaje: this.obtenerMensajeEstado(params['status'], params['payment_type'])
        };
        
        // Detectar si es PSE o Efecty
        this.detectarMetodoPago(params['payment_type']);
        
        console.log('📊 Estado de pago obtenido de URL:', this.estadoPago);
      } 
      // Si no hay parámetros, intentar obtener del servicio
      else {
        const estadoGuardado = this.comprarService.getEstadoPago();
        if (estadoGuardado) {
          this.estadoPago = estadoGuardado;
          this.detectarMetodoPago(estadoGuardado.payment_method);
          console.log('📊 Estado de pago obtenido del servicio:', this.estadoPago);
        } else {
          // Estado por defecto si no hay información
          this.estadoPago = {
            payment_id: null,
            status: 'pending',
            payment_method: null,
            transaction_amount: null,
            error_message: null,
            mensaje: this.obtenerMensajeEstado('pending', null)
          };
          console.log('⚠️ No hay información de pago, usando estado por defecto');
        }
      }
      
      // Si hay payment_id, escuchar cambios en Firestore (para PSE/Efecty)
      if (this.estadoPago?.payment_id && (this.esPSE || this.esEfecty || this.estadoPago.status === 'pending')) {
        this.escucharActualizacionPago(this.estadoPago.payment_id);
      }
    });
  }
  
  /**
   * Escucha cambios en tiempo real del pago en Firestore
   * Cuando el webhook actualiza el estado, este listener lo detecta
   */
  escucharActualizacionPago(paymentId: string): void {
    console.log('👂 Escuchando actualizaciones del pago:', paymentId);
    
    const paymentRef = doc(this.firestore, `mercadopago_payments/${paymentId}`);
    
    this.paymentSubscription = onSnapshot(paymentRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const paymentData = docSnapshot.data();
        console.log('🔄 Actualización de pago recibida:', paymentData);
        
        // Actualizar el estado del pago con los nuevos datos
        if (paymentData['status']) {
          const estadoAnterior = this.estadoPago.status;
          
          this.estadoPago = {
            payment_id: paymentData['paymentId'],
            status: paymentData['status'],
            status_detail: paymentData['status_detail'],
            payment_method: paymentData['payment_method_id'],
            transaction_amount: paymentData['transaction_amount'],
            date_approved: paymentData['date_approved'],
            mensaje: this.obtenerMensajeEstado(paymentData['status'], paymentData['payment_method_id'])
          };
          
          console.log('✅ Estado actualizado:', {
            anterior: estadoAnterior,
            nuevo: this.estadoPago.status
          });
          
          // Si el pago fue aprobado, crear la venta en Firestore
          if (this.estadoPago.status === 'approved' && estadoAnterior !== 'approved') {
            console.log('🎉 ¡Pago aprobado! Creando venta en Firestore...');
            
            // Mostrar indicador de que se está creando la venta
            this.creandoVenta = true;
            
            // Crear la venta directamente aquí
            await this.crearVentaDesdePayment(paymentData);
            
            // También actualizar la UI local
            this.detectarMetodoPago(paymentData['payment_method_id']);
          }
        }
      }
    }, (error) => {
      console.error('❌ Error escuchando actualizaciones del pago:', error);
    });
  }
  
  ngOnDestroy(): void {
    // Cancelar la suscripción al destruir el componente
    if (this.paymentSubscription) {
      console.log('🔌 Cancelando suscripción al pago');
      this.paymentSubscription();
    }
  }

  detectarMetodoPago(paymentType: string | null): void {
    if (!paymentType) return;
    
    const paymentTypeLower = paymentType.toLowerCase();
    
    // PSE se identifica como 'pse' o 'bank_transfer'
    this.esPSE = paymentTypeLower.includes('pse') || paymentTypeLower.includes('bank_transfer');
    
    // Efecty y otros pagos en efectivo se identifican como 'ticket' o contienen 'efecty', 'baloto', etc.
    this.esEfecty = paymentTypeLower.includes('efecty') || 
                    paymentTypeLower.includes('ticket') || 
                    paymentTypeLower.includes('baloto') ||
                    paymentTypeLower.includes('punto');
    
    console.log('💳 Método de pago detectado:', {
      type: paymentType,
      esPSE: this.esPSE,
      esEfecty: this.esEfecty
    });
  }

  obtenerMensajeEstado(status: string, paymentMethod?: string | null): string {
    // Mensajes específicos para PSE y Efecty en estado pending
    if (status === 'pending' || status === 'in_process') {
      const methodLower = paymentMethod?.toLowerCase() || '';
      
      if (methodLower.includes('pse') || methodLower.includes('bank_transfer')) {
        return '🏦 Esperando confirmación de PSE';
      }
      
      if (methodLower.includes('efecty') || methodLower.includes('ticket') || 
          methodLower.includes('baloto') || methodLower.includes('punto')) {
        return '💵 Esperando pago en efectivo';
      }
    }
    
    // Mensajes estándar
    const mensajes: { [key: string]: string } = {
      'approved': '✓ Aprobado',
      'pending': '⏱ Pendiente',
      'rejected': '✗ Rechazado',
      'in_process': '🔄 En proceso'
    };
    return mensajes[status] || 'Desconocido';
  }

  verMisCompras(): void {
    if (this.usuario) {
      this.router.navigate([this.usuario.usuario, 'compras']);
    }
  }

  volverInicio(): void {
    this.router.navigate(['']);
  }

  volverAIntentar(): void {
    // Volver a la página de métodos de pago
    this.router.navigate(['comprar/checkout/pago']);
  }

  /**
   * Crea la venta en Firestore cuando el pago es aprobado por webhook
   */
  async crearVentaDesdePayment(paymentData: any): Promise<void> {
    try {
      console.log('🏭 Iniciando creación de venta con datos de pago:', paymentData);
      
      if (!this.usuario) {
        console.error('❌ No hay usuario disponible para crear la venta');
        this.creandoVenta = false;
        return;
      }

      // Verificar que el usuario tiene referencias de compra
      if (!this.usuario.referenciaCompra || this.usuario.referenciaCompra.length === 0) {
        console.error('❌ El usuario no tiene referencias de compra');
        this.creandoVenta = false;
        return;
      }

      console.log('📦 Referencias de compra encontradas:', this.usuario.referenciaCompra.length);

      // Obtener la dirección de envío
      const direccionSeleccionada = this.comprarService.getDireccionEnvio();
      if (!direccionSeleccionada) {
        console.error('❌ No hay dirección de envío seleccionada');
        this.creandoVenta = false;
        return;
      }

      // Agrupar referencias por vendedor
      await this.agruparReferenciasPorVendedor(this.usuario);

      // Crear una venta por cada vendedor
      for (let idVendedor in this.grupoReferencias) {
        console.log(`🏪 Creando venta para vendedor: ${idVendedor}`);
        
        // Obtener y actualizar el número de venta
        const refVenta = doc(this.firestore, 'cookies/informacion');
        
        // Verificar si el documento existe
        const docSnapshot = await getDoc(refVenta);
        if (!docSnapshot.exists()) {
          await setDoc(refVenta, { ventas: 0 });
          console.log('✅ Documento cookies/informacion creado');
        }
        
        // Incrementar el contador de ventas
        await updateDoc(refVenta, {
          ventas: increment(1)
        });
        
        const infoVentasRef = await getDoc(refVenta);
        const referencias = this.grupoReferencias[idVendedor];
        const numVenta = infoVentasRef.data()!;
        
        const venta: any = {
          numVenta: numVenta['ventas'],
          referencias: referencias,
          fechaVenta: new Date(),
          enCamino: false,
          entregado: false,
          idCliente: this.usuario.id!,
          idVendedor: idVendedor,
          datosEnvio: direccionSeleccionada,
          cancelada: false,
          // Datos del pago de MercadoPago
          payment_id: paymentData['paymentId'] || paymentData['id'],
          payment_status: paymentData['status'],
          payment_method: paymentData['payment_method_id'],
          transaction_amount: paymentData['transaction_amount']
        };
        
        console.log('💾 Guardando venta en Firestore:', venta);
        await this.comprarService.agregarVenta(venta);
        console.log(`✅ Venta ${numVenta['ventas']} creada exitosamente para vendedor ${idVendedor}`);
      }
      
      // Actualizar UI
      this.creandoVenta = false;
      this.ventaCreada = true;
      console.log('🎉 ¡Todas las ventas creadas exitosamente!');
      
      // Scroll to top para ver el mensaje de éxito
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('❌ Error creando venta:', error);
      this.creandoVenta = false;
      // Podrías mostrar un mensaje de error al usuario aquí
    }
  }

  /**
   * Agrupa las referencias de compra por vendedor
   */
  async agruparReferenciasPorVendedor(usuario: Usuario): Promise<void> {
    const referenciasCompra = await this.convertirReferenciasACompra(usuario.referenciaCompra!);
    const productosSnapshot = await Promise.all(referenciasCompra.map(async (ref: porComprar) => {
      return await getDoc(doc(this.firestore, `productos/${ref.idProducto}`))
    }));

    this.grupoReferencias = {};
    
    productosSnapshot.forEach((productoSnapshot, index) => {
      const prd = productoSnapshot.data() as Producto;
      const idVendedor = prd.idUsuario;

      if (!this.grupoReferencias[idVendedor!]) {
        this.grupoReferencias[idVendedor!] = [];
      }

      this.grupoReferencias[idVendedor!].push(referenciasCompra[index]);
    });
    
    console.log('📊 Referencias agrupadas por vendedor:', this.grupoReferencias);
  }

  /**
   * Convierte las referencias de compra del usuario a objetos porComprar
   */
  async convertirReferenciasACompra(referencias: referenciaCompra[]): Promise<porComprar[]> {
    return await Promise.all(referencias!.map(async (referencia: referenciaCompra) => {
      const productoSnapshot = await getDoc(referencia.producto);
      const producto = productoSnapshot.data() as Producto;
      await updateDoc(referencia.producto, {ventas: increment(1)});
      
      // Manejar foto: puede venir de fotos[] o ser undefined
      const foto = producto.fotos && producto.fotos.length > 0 ? producto.fotos[0] : '';
      
      return {
        idProducto: referencia.producto.id,
        tituloProducto: producto.nombre,
        precioProducto: producto.precio,
        foto: foto,
        unidades: referencia.unidades,
        envioGratis: producto.envioGratis,
        precioEnvio: producto.precioEnvio,
        gramosTamanio: typeof referencia.tamanioIndex == 'number' ? producto.tamanios![referencia.tamanioIndex].gramos : 'false'
      } as porComprar
    }));
  }
}
