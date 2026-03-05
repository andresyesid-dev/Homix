import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ComprarService } from 'src/app/servicios/comprar/comprar.service';
import { Producto } from 'src/app/interfaces/producto/producto';
import { Subscription } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { heroTruck, heroCheckBadge, heroXMark, heroArrowPath } from '@ng-icons/heroicons/outline';
import { ionChevronDown } from '@ng-icons/ionicons';

declare let MercadoPago: any;

@Component({
  selector: 'app-datos-envio',
  templateUrl: './datos-envio.component.html',
  styleUrls: ['./datos-envio.component.scss'],
  providers: [provideIcons({heroTruck, heroCheckBadge, heroXMark, heroArrowPath, ionChevronDown})]
})
export class DatosEnvioComponent implements OnInit, OnDestroy {

  form?: FormGroup;
  
  // Propiedades del producto
  productoCompra?: Producto;
  unidades: number = 1;
  tamanioSelec: number = 0;
  
  // Propiedades del pago
  procestandoPago: boolean = false;
  pagoCompletado: boolean = false;
  errorPago: string = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private comprarService: ComprarService
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.cargarDatosProducto();
    this.configurarMercadoPago();

    // Suscribirse a los cambios de validez del formulario
    const formValidSub = this.form?.statusChanges.subscribe(() => {
      if (this.form?.valid && !this.procestandoPago && !this.pagoCompletado) {
        setTimeout(() => this.inicializarBrick(), 100);
      }
    });
    if (formValidSub) {
      this.subscriptions.push(formValidSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createForm(){
    this.form = this.fb.group({
      nombresApellidos: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      tipoIdentidad: ['', Validators.required],
      numeroIdentificacion: ['', [Validators.required, Validators.minLength(7)]],
      municipioLocalidad: ['', Validators.required],
      barrio: ['', Validators.required],
      tipoCalle: ['', Validators.required],
      calle: ['', Validators.required],
      numero: ['', Validators.required],
      guion: ['', Validators.required],
      detalle: ['', Validators.required],
      indicaciones: ['']
    })
  }

  cargarDatosProducto(): void {
    const datosProducto = this.comprarService.getProductoCompra();
    if (datosProducto) {
      this.productoCompra = datosProducto.producto || undefined;
      this.unidades = datosProducto.unidades;
      this.tamanioSelec = datosProducto.tamanioSelec;
    } else {
      // Si no hay datos del producto, redirigir al inicio
      this.router.navigate(['/inicio']);
    }
  }

  obtenerImagenProducto(): string {
    if (!this.productoCompra || !this.productoCompra.fotos || this.productoCompra.fotos.length === 0) {
      return 'assets/img/productos/producto-default.png';
    }
    return this.comprarService.buildRutaFotoProducto(this.productoCompra.fotos[0]);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/img/productos/producto-default.png';
  }

  calcularTotal(): number {
    if (!this.productoCompra) return 0;
    
    const precio = this.productoCompra.tamanios 
      ? this.productoCompra.tamanios[this.tamanioSelec].precio 
      : this.productoCompra.precio;
    
    return precio * this.unidades;
  }

  invalid(input: string): boolean {
    const inputForm = this.form?.get(input);
    return !!(inputForm?.invalid && (inputForm?.dirty || inputForm?.touched));
  }

  configurarMercadoPago(): void {
    if (typeof MercadoPago === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        this.inicializarMercadoPago();
      };
      document.head.appendChild(script);
    } else {
      this.inicializarMercadoPago();
    }
  }

  inicializarMercadoPago(): void {
    MercadoPago.initialize('APP_USR-c9b7f319-d38d-4f02-bb9e-9b7446907b9d');
  }

  inicializarBrick(): void {
    if (!this.form?.valid || this.procestandoPago || this.pagoCompletado) {
      return;
    }

    const brickContainer = document.getElementById('brick-container');
    if (brickContainer) {
      brickContainer.innerHTML = '';
    }

    const bricksBuilder = MercadoPago.bricks();
    
    bricksBuilder.create('payment', 'brick-container', {
      initialization: {
        amount: this.calcularTotal(),
        preferenceId: null,
        payer: {
          firstName: '',
          lastName: '',
          email: ''
        }
      },
      customization: {
        visual: {
          style: {
            theme: 'flat',
            customVariables: {
              formBackgroundColor: '#ffffff',
              baseColor: '#FF9C53',
              baseColorFirstVariant: '#ff8533',
              baseColorSecondVariant: '#ffb373',
              errorColor: '#f44336',
              successColor: '#4caf50',
              outlinePrimaryColor: '#FF9C53',
              outlineSecondaryColor: '#e0e0e0',
              fontSizeExtraSmall: '12px',
              fontSizeSmall: '14px',
              fontSizeMedium: '16px',
              fontSizeLarge: '18px',
              fontWeight: '400',
              fontWeightSemiBold: '600',
              formInputsTextTransform: 'none',
              inputBackgroundColor: '#ffffff',
              inputFocusedBackgroundColor: '#ffffff',
              inputBorderColor: '#e0e0e0',
              inputFocusedBorderColor: '#FF9C53',
              inputBorderWidth: '1px',
              inputBorderRadius: '8px',
              inputVerticalPadding: '12px',
              inputHorizontalPadding: '16px',
              formSubmitBackgroundColor: '#FF9C53',
              formSubmitDisabledBackgroundColor: '#cccccc',
              formSubmitFocusedBackgroundColor: '#ff8533',
              formSubmitHoverBackgroundColor: '#ff8533',
              formSubmitBorderColor: '#FF9C53',
              formSubmitBorderWidth: '0px',
              formSubmitBorderRadius: '8px',
              formSubmitVerticalPadding: '14px',
              formSubmitHorizontalPadding: '24px',
              secondaryColor: '#757575',
              warningColor: '#ff9800',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }
          }
        },
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          ticket: 'all',
          bankTransfer: ['pse'],
          atm: ['efecty'],
          mercadoPago: 'all'
        },
        texts: {
          formTitle: 'Completa tu información',
          emailSectionTitle: 'Email de contacto',
          cardholderName: {
            label: 'Nombre completo',
            placeholder: 'Ingresa tu nombre completo'
          },
          email: {
            label: 'Email',
            placeholder: 'Ingresa tu email'
          },
          cardholderIdentification: {
            label: 'Número de documento'
          },
          cardNumber: {
            label: 'Número de tarjeta',
            placeholder: '0000 0000 0000 0000'
          },
          expirationDate: {
            label: 'Fecha de vencimiento',
            placeholder: 'MM/AA'
          },
          securityCode: {
            label: 'Código de seguridad',
            placeholder: '123'
          }
        }
      },
      callbacks: {
        onReady: () => {
          console.log('Brick de pago listo');
        },
        onSubmit: (cardFormData: any) => {
          return this.procesarPago(cardFormData);
        },
        onError: (error: any) => {
          console.error('Error en el brick de pago:', error);
          this.errorPago = 'Error al cargar el formulario de pago';
        }
      }
    });
  }

  async procesarPago(formData: any): Promise<void> {
    if (!this.form?.valid || !this.productoCompra) {
      throw new Error('Datos incompletos');
    }

    this.procestandoPago = true;
    this.errorPago = '';

    try {
      const datosPago = {
        producto: this.productoCompra,
        unidades: this.unidades,
        tamanioSelec: this.tamanioSelec,
        total: this.calcularTotal(),
        datosEnvio: this.form.value,
        datosPago: formData
      };

      const resultado = await this.comprarService.procesarPagoCompleto(datosPago);
      
      if (resultado && resultado.success && resultado.payment?.status === 'approved') {
        this.pagoCompletado = true;
        
        setTimeout(() => {
          this.router.navigate(['comprar/checkout/resumen'], {
            queryParams: { payment_id: resultado.payment?.id }
          });
        }, 2000);
      } else {
        throw new Error('El pago no fue aprobado');
      }
    } catch (error: any) {
      console.error('Error procesando el pago:', error);
      this.errorPago = error.message || 'Error al procesar el pago. Inténtalo nuevamente.';
    } finally {
      this.procestandoPago = false;
    }
  }

  async iniciarProcesoPago(): Promise<void> {
    this.errorPago = '';
    this.procestandoPago = false;
    this.pagoCompletado = false;
    
    if (this.form?.valid) {
      setTimeout(() => this.inicializarBrick(), 100);
    }
  }

  submit() {
    if (this.form?.valid) {
      // El submit ahora solo valida el formulario
      // El pago se maneja a través del brick de MercadoPago
      console.log('Formulario válido, inicializando pago...');
    }
  }

}
