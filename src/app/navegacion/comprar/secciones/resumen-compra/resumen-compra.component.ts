import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
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
export class ResumenCompraComponent implements OnInit, OnDestroy, OnChanges {

  @Input() productosLenght: number = 0;
  @Input() precioProductos: number = 0;
  @Input() precioEnvios: number = 0;
  @Input() cargando: boolean = false;
  @Input() actualizacionExitosa: boolean = false;
  @Input() botonHabilitado: boolean = false;
  @Input() pasoActual: string = 'direccion';
  @Input() esModoMovil: boolean = false;
  
  @Output() procesarCompra = new EventEmitter<void>();
  @Output() cerrarBricks = new EventEmitter<void>();

  // Propiedades para MercadoPago Bricks
  mostrarBrickPago: boolean = false;
  cargandoBrick: boolean = false;
  procestandoPago: boolean = false;
  mercadoPagoListo: boolean = false;
  errorPago: string = '';
  brickContainerId: string = 'payment-brick-container';
  private mp: any = null;
  private paymentBrickController: any = null;

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
      // En móvil, solo responder si estamos en el paso correcto (pago)
      if (this.esModoMovil && this.pasoActual !== 'pago') {
        return;
      }
      
      this.mostrarPaymentBrick();
    });
    this.subscriptions.push(iniciarPagoSub);
    
    // Verificar si debe mostrar bricks automáticamente (móvil paso 3)
    this.verificarMostrarBricksAutomatico();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia pasoActual, manejar transiciones
    if (changes['pasoActual']) {
      const pasoAnterior = changes['pasoActual'].previousValue;
      const pasoNuevo = changes['pasoActual'].currentValue;
      
      // Si salimos del paso 'pago', cerrar bricks
      if (pasoAnterior === 'pago' && pasoNuevo !== 'pago' && this.mostrarBrickPago) {
        this.cerrarBrick();
      }
      
      // Verificar si debe mostrar bricks en el nuevo paso
      setTimeout(() => {
        this.verificarMostrarBricksAutomatico();
      }, 100);
    }
    
    // Si cambia esModoMovil, verificar si debe mostrar bricks
    if (changes['esModoMovil']) {
      setTimeout(() => {
        this.verificarMostrarBricksAutomatico();
      }, 100);
    }
  }

  /**
   * Verifica si debe mostrar los bricks automáticamente en móvil paso 3
   */
  private verificarMostrarBricksAutomatico(): void {
    // Solo mostrar bricks en móvil cuando estamos específicamente en el paso 'pago'
    // Y no en otros pasos como 'detalles'
    if (this.esModoMovil && this.pasoActual === 'pago' && !this.mostrarBrickPago) {
      setTimeout(() => {
        this.mostrarPaymentBrick();
      }, 300);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destruirBrickActual();
  }

  private async destruirBrickActual(): Promise<void> {
    if (this.paymentBrickController) {
      try {
        await this.paymentBrickController.unmount();
        this.paymentBrickController = null;
      } catch (error) {
        console.error('Error al desmontar el brick de pago:', error);
        this.paymentBrickController = null;
      }
    }
  }

  async cargarMercadoPagoSDK(): Promise<void> {
    if (this.mercadoPagoListo) {
      this.inicializarMercadoPago();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        this.inicializarMercadoPago();
        resolve();
      };
      script.onerror = (error) => {
        console.error('Error al cargar el SDK de MercadoPago:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  inicializarMercadoPago(): void {
    if (this.mercadoPagoListo) return;
    try {
      const publicKey = environment.mercadoPago?.publicKey;
      if (!publicKey) {
        console.error('❌ No se encontró la clave pública de MercadoPago');
        return;
      }
      
      // Crear instancia de MercadoPago (SDK v2)
      this.mp = new MercadoPago(publicKey, { locale: 'es-CO' });
      this.mercadoPagoListo = true;
    } catch (error) {
      console.error('Error al inicializar MercadoPago:', error);
    }
  }

  async mostrarPaymentBrick(): Promise<void> {
    if (this.cargandoBrick || this.mostrarBrickPago) {
      return;
    }

    this.cargandoBrick = true;
    this.errorPago = '';

    try {
      await this.cargarMercadoPagoSDK();
      await this.destruirBrickActual(); 

      this.mostrarBrickPago = true;
      this.cdr.detectChanges();

      await this.renderizarPaymentBrick();

    } catch (error) {
      console.error('Error al mostrar el brick de pago:', error);
      this.errorPago = 'No se pudo mostrar el formulario de pago. Inténtalo de nuevo.';
      this.mostrarBrickPago = false;
    } finally {
      this.cargandoBrick = false;
      this.cdr.detectChanges();
    }
  }

  async renderizarPaymentBrick(): Promise<void> {
    const totalCompra = this.precioProductos + this.precioEnvios;

    const settings = {
      initialization: {
        amount: totalCompra,
        payer: { email: '' },
      },
      customization: {
        paymentMethods: {
          maxInstallments: 12,
          creditCard: 'all',
          debitCard: 'all',
          bankTransfer: 'all',
          ticket: 'all'
        },
        visual: { style: { theme: 'default' } }
      },
      callbacks: {
        onReady: () => {
          this.cargandoBrick = false;
          this.cdr.detectChanges();
        },
        onSubmit: (formData: any) => this.procesarPago(formData),
        onError: (error: any) => {
          console.error('Error en Payment Brick:', error);
          this.errorPago = 'Ocurrió un error en el formulario de pago. Por favor, verifica tus datos.';
          this.cargandoBrick = false;
          this.cdr.detectChanges();
        },
      },
    };

    const bricksBuilder = this.mp.bricks();
    this.paymentBrickController = await bricksBuilder.create('payment', this.brickContainerId, settings);
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

  /**
   * Método público para cerrar bricks desde el componente padre (móvil)
   */
  public cerrarBricksDesdeMovil(): void {
    if (this.mostrarBrickPago) {
      this.cerrarBrick();
    }
  }

  async cerrarBrick(): Promise<void> {
    await this.destruirBrickActual();
    this.mostrarBrickPago = false;
    this.errorPago = '';
    this.cargandoBrick = false;
    this.cerrarBricks.emit();
    this.cdr.detectChanges();
  }

  onProcesarCompra(): void {
    if (this.botonHabilitado && !this.cargando) {
      this.procesarCompra.emit();
    }
  }

  getTextoBoton(): string {
    if (this.esModoMovil) {
      if (this.pasoActual === 'direccion') {
        return 'Continuar';
      } else if (this.pasoActual === 'detalles') {
        return 'Ir al pago';
      } else if (this.pasoActual === 'pago') {
        return 'Ir al pago';
      }
    } else {
      // Modo desktop
      if (this.pasoActual === 'direccion') {
        return 'Continuar';
      } else if (this.pasoActual === 'pago') {
        return 'Ir al pago';
      }
    }
    return 'Ir al pago';
  }

}
