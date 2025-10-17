import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { matCheck } from '@ng-icons/material-icons/baseline';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { environment } from 'src/environments/environment';

declare let MercadoPago: any;

@Component({
  selector: 'app-resumen-compra',
  templateUrl: './resumen-compra.component.html',
  styleUrls: ['./resumen-compra.component.scss'],
  providers: [provideIcons({matCheck})]
})
export class ResumenCompraComponent implements OnInit, OnDestroy {

  @Input() productosLenght: number = 0;
  @Input() precioProductos: number = 0;
  @Input() precioEnvios: number = 0;
  @Input() cargando: boolean = false;
  @Input() actualizacionExitosa: boolean = false;
  @Input() botonHabilitado: boolean = false;
  @Input() pasoActual: string = 'direccion';
  
  @Output() procesarCompra = new EventEmitter<void>();

  // Propiedades para MercadoPago Bricks
  mostrarBrickPago: boolean = false;
  cargandoBrick: boolean = false;
  procestandoPago: boolean = false;
  mercadoPagoListo: boolean = false;
  errorPago: string = '';
  private mp: any = null; // Instancia de MercadoPago

  private subscriptions: Subscription[] = [];

  constructor(
    private comprarService: ComprarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Cargar SDK de MercadoPago
    this.cargarMercadoPagoSDK();

    // Escuchar el evento para iniciar el pago
    const iniciarPagoSub = this.comprarService.iniciarPago$.subscribe(() => {
      console.log('👂 ResumenCompra: Recibió evento para mostrar Payment Brick');
      this.mostrarPaymentBrick();
    });
    this.subscriptions.push(iniciarPagoSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async cargarMercadoPagoSDK(): Promise<void> {
    if (typeof MercadoPago !== 'undefined') {
      console.log('✅ SDK de MercadoPago ya cargado');
      this.inicializarMercadoPago();
      return Promise.resolve();
    }

    console.log('📦 Cargando SDK de MercadoPago...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        console.log('✅ SDK de MercadoPago cargado');
        this.inicializarMercadoPago();
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Error al cargar SDK de MercadoPago');
        reject(new Error('Error al cargar MercadoPago SDK'));
      };
      document.head.appendChild(script);
    });
  }

  inicializarMercadoPago(): void {
    try {
      const publicKey = environment.mercadoPago?.publicKey;
      if (!publicKey) {
        console.error('❌ No se encontró la clave pública de MercadoPago');
        return;
      }
      
      // Crear instancia de MercadoPago (SDK v2)
      this.mp = new MercadoPago(publicKey, {
        locale: 'es-CO'
      });
      
      this.mercadoPagoListo = true;
      console.log('✅ MercadoPago inicializado con clave:', publicKey.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Error al inicializar MercadoPago:', error);
    }
  }

  async mostrarPaymentBrick(): Promise<void> {
    console.log('🎨 Mostrando Payment Brick en resumen lateral...');
    this.mostrarBrickPago = true;
    this.cargandoBrick = true;
    this.errorPago = '';

    // Esperar a que MercadoPago esté listo
    if (!this.mercadoPagoListo) {
      console.log('⏳ Esperando a que MercadoPago SDK esté listo...');
      await this.cargarMercadoPagoSDK();
    }

    setTimeout(() => {
      this.inicializarPaymentBrick();
    }, 300);
  }

  inicializarPaymentBrick(): void {
    if (!this.mercadoPagoListo || !this.mp) {
      console.error('❌ MercadoPago SDK no está listo después de esperar');
      this.errorPago = 'Error al cargar MercadoPago. Recarga la página.';
      this.cargandoBrick = false;
      this.cdr.detectChanges(); // Forzar detección de cambios
      return;
    }

    const totalCompra = this.precioProductos + this.precioEnvios;
    console.log('💰 Total de la compra:', totalCompra);

    const brickContainer = document.getElementById('payment-brick-container');
    
    if (!brickContainer) {
      console.error('❌ No se encontró el contenedor del brick');
      this.cargandoBrick = false;
      this.errorPago = 'Error al inicializar el formulario de pago';
      this.cdr.detectChanges(); // Forzar detección de cambios
      return;
    }

    brickContainer.innerHTML = '';

    // Usar la instancia de MercadoPago para crear el brick
    const bricksBuilder = this.mp.bricks();
    
    bricksBuilder.create('payment', 'payment-brick-container', {
      initialization: {
        amount: totalCompra,
        payer: {
          email: ''
        }
      },
      customization: {
        paymentMethods: {
          maxInstallments: 12,
          creditCard: 'all',
          debitCard: 'all',
          bankTransfer: 'all',  // PSE (Transferencia bancaria)
          ticket: 'all'         // Efecty y otros pagos en efectivo
        },
        visual: {
          style: {
            theme: 'default'
          }
        }
      },
      callbacks: {
        onReady: () => {
          console.log('✅ Payment Brick listo con todos los métodos de pago');
          this.cargandoBrick = false;
          this.cdr.detectChanges(); // Forzar detección de cambios
        },
        onSubmit: async (formData: any) => {
          console.log('💳 Usuario completó el formulario, procesando pago...');
          return this.procesarPago(formData);
        },
        onError: (error: any) => {
          console.error('❌ Error en Payment Brick:', error);
          this.cargandoBrick = false;
          this.errorPago = 'Error al cargar el formulario de pago';
          this.cdr.detectChanges(); // Forzar detección de cambios
        }
      }
    });
  }

  async procesarPago(formData: any): Promise<void> {
    this.procestandoPago = true;
    this.errorPago = '';

    try {
      console.log('💰 Procesando pago con MercadoPago...', formData);
      console.log('📋 Estructura completa de formData:', JSON.stringify(formData, null, 2));
      
      // El Payment Brick envía los datos dentro de formData.formData
      const paymentFormData = formData.formData || formData;
      
      // Determinar el tipo de pago
      const paymentMethodId = paymentFormData.payment_method_id;
      const esPagoConTarjeta = paymentFormData.token != null;
      const esPSE = paymentMethodId === 'pse';
      
      console.log('🔍 Tipo de pago detectado:', {
        payment_method_id: paymentMethodId,
        tiene_token: esPagoConTarjeta,
        es_pse: esPSE
      });
      
      // Estructurar datos según el tipo de pago
      const datosPago: any = {
        datosPago: {
          payment_method_id: paymentMethodId,
          installments: paymentFormData.installments || 1,
          payer: {
            email: paymentFormData.payer?.email || '',
            identification: paymentFormData.payer?.identification
          }
        },
        total: this.precioProductos + this.precioEnvios,
        producto: { nombre: 'Compra en Homix' },
        unidades: 1
      };

      // Solo agregar token si es pago con tarjeta
      if (esPagoConTarjeta) {
        datosPago.datosPago.token = paymentFormData.token;
        console.log('💳 Pago con tarjeta - Token incluido');
      } else {
        console.log('🏦 Pago sin token (PSE/Efecty/Otros)');
        
        // Para PSE, agregar datos específicos requeridos
        if (esPSE) {
          // entity_type es requerido para PSE: 'individual' o 'association'
          datosPago.datosPago.payer.entity_type = paymentFormData.payer?.entity_type || 'individual';
          
          // financial_institution viene en transaction_details del Payment Brick
          if (paymentFormData.transaction_details?.financial_institution) {
            datosPago.datosPago.transaction_details = {
              financial_institution: paymentFormData.transaction_details.financial_institution
            };
          }
          
          console.log('🏦 PSE - Datos específicos agregados:', {
            entity_type: datosPago.datosPago.payer.entity_type,
            financial_institution: datosPago.datosPago.transaction_details?.financial_institution
          });
        }
        
        // Para otros métodos, puede venir transaction_details
        if (!esPSE && paymentFormData.transaction_details) {
          datosPago.datosPago.transaction_details = paymentFormData.transaction_details;
        }
      }

      console.log('📤 Datos estructurados para Cloud Function:', JSON.stringify(datosPago, null, 2));

      // Validar que tenemos el email
      if (!datosPago.datosPago.payer.email) {
        throw new Error('No se proporcionó el email del comprador');
      }

      // Llamar a la Cloud Function real
      const resultado = await this.comprarService.procesarPagoCompleto(datosPago);
      
      console.log('📨 Resultado de MercadoPago:', resultado);

      // Guardar el estado del pago completo para mostrarlo después
      const estadoPago = {
        success: resultado.success,
        status: resultado.payment?.status,
        status_detail: resultado.payment?.status_detail,
        payment_id: resultado.payment?.id,
        payment_method: resultado.payment?.payment_method_id,
        transaction_amount: resultado.payment?.transaction_amount,
        mensaje: this.obtenerMensajeEstado(resultado.payment?.status, resultado.payment?.status_detail)
      };

      this.comprarService.setEstadoPago(estadoPago);

      if (resultado.success && resultado.payment && resultado.payment.status === 'approved') {
        console.log('✅ Pago aprobado por MercadoPago');
        
        // Notificar que el pago fue aprobado (esto creará la venta)
        this.comprarService.notificarPagoAprobado(resultado.payment);

        console.log('✅ Pago aprobado, se creará la venta');
        
        // El componente comprar se encargará de redirigir después de crear la venta
      } else {
        console.warn('⚠️ Pago no fue aprobado:', resultado.payment?.status);
        
        // Incluso si no es aprobado, guardamos el estado para mostrarlo
        this.comprarService.setEstadoPago(estadoPago);
        
        // Redirigir a la página de respuesta para mostrar el error
        setTimeout(() => {
          console.log('🔄 Pago no aprobado, redirigiendo a página de respuesta...');
          this.router.navigate(['comprar/checkout/response'], {
            queryParams: {
              payment_id: resultado.payment?.id,
              status: resultado.payment?.status,
              payment_type: resultado.payment?.payment_method_id,
              transaction_amount: resultado.payment?.transaction_amount
            }
          });
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('❌ Error procesando pago:', error);
      
      // Guardar estado de error
      const estadoError = {
        success: false,
        status: 'rejected',
        status_detail: 'error',
        payment_id: null,
        payment_method: null,
        transaction_amount: this.precioProductos + this.precioEnvios,
        mensaje: error.message || 'Error al procesar el pago. Intenta nuevamente.'
      };
      
      this.comprarService.setEstadoPago(estadoError);
      
      // Redirigir a la página de respuesta también en caso de error
      setTimeout(() => {
        console.log('🔄 Error en pago, redirigiendo a página de respuesta...');
        this.router.navigate(['comprar/checkout/response'], {
          queryParams: {
            status: 'rejected',
            error: error.message || 'Error desconocido',
            transaction_amount: this.precioProductos + this.precioEnvios
          }
        });
      }, 1500);
    } finally {
      this.procestandoPago = false;
    }
  }

  obtenerMensajeEstado(status?: string, statusDetail?: string): string {
    if (status === 'approved') {
      return '✅ Pago aprobado exitosamente';
    } else if (status === 'rejected') {
      switch (statusDetail) {
        case 'cc_rejected_bad_filled_security_code':
          return '❌ Código de seguridad inválido';
        case 'cc_rejected_bad_filled_date':
          return '❌ Error en la fecha de vencimiento';
        case 'cc_rejected_insufficient_amount':
          return '❌ Fondos insuficientes';
        case 'cc_rejected_call_for_authorize':
          return '⚠️ Debes autorizar el pago con tu banco';
        case 'cc_rejected_card_disabled':
          return '❌ Tarjeta deshabilitada';
        case 'cc_rejected_bad_filled_other':
          return '❌ Error en los datos del formulario';
        default:
          return '❌ Pago rechazado';
      }
    } else if (status === 'pending') {
      return '⏳ Pago pendiente de confirmación';
    } else if (status === 'in_process') {
      return '🔄 Pago en proceso de validación';
    }
    return '❌ Error al procesar el pago';
  }

  cerrarBrick(): void {
    this.mostrarBrickPago = false;
    this.errorPago = '';
  }

  onProcesarCompra(): void {
    if (this.botonHabilitado && !this.cargando) {
      this.procesarCompra.emit();
    }
  }

  getTextoBoton(): string {
    if (this.pasoActual === 'direccion') {
      return 'Continuar al pago';
    } else if (this.pasoActual === 'pago') {
      return 'Procesar compra';
    }
    return 'Procesar compra';
  }

}
