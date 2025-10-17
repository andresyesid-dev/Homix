import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes } from './comprar-routing.module';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ComponentesGeneralesModule } from '../componentes-generales/componentes-generales.module';

import { ComprarComponent } from './comprar.component';
import { MetodoPagoComponent } from './secciones/metodo-pago/metodo-pago.component';
import { CambiarDireccionComponent } from './secciones/cambiar-direccion/cambiar-direccion.component';
import { SelectorDireccionesComponent } from './secciones/selector-direcciones/selector-direcciones.component';
import { FormularioDireccionComponent } from './secciones/formulario-direccion/formulario-direccion.component';
import { ResumenCompraComponent } from './secciones/resumen-compra/resumen-compra.component';
import { RespuestaCompraComponent } from './secciones/respuesta-compra/respuesta-compra.component';

@NgModule({
  declarations: [
    ComprarComponent,
    SelectorDireccionesComponent,
    FormularioDireccionComponent,
    MetodoPagoComponent,
    CambiarDireccionComponent,
    ResumenCompraComponent,
    RespuestaCompraComponent
  ],
  imports: [
    CommonModule,
    ComponentesGeneralesModule,
    NgIconsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ComprarModule { }
