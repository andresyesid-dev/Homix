import { ComprarComponent } from './comprar.component'
import { Routes } from '@angular/router';
import { SelectorDireccionesComponent } from './secciones/selector-direcciones/selector-direcciones.component';
import { DetallesCompraComponent } from './secciones/detalles-compra/detalles-compra.component';
import { RespuestaCompraComponent } from './secciones/respuesta-compra/respuesta-compra.component';
import { FormularioDireccionComponent } from './secciones/formulario-direccion/formulario-direccion.component';

export const routes: Routes = [
  {
    path: 'comprar/checkout',
    component: ComprarComponent,
    children: [
      {
        path: '',
        redirectTo: 'seleccionar-direccion',
        pathMatch: 'full'
      },
      {
        path: 'seleccionar-direccion',
        component: SelectorDireccionesComponent
      },
      {
        path: 'agregar-direccion',
        component: FormularioDireccionComponent
      },
      {
        path: 'actualizar-direccion/:id',
        component: FormularioDireccionComponent
      },
      {
        path: 'detalles-compra',
        component: DetallesCompraComponent
      },
      {
        path: 'pago',
        component: DetallesCompraComponent
      },
      {
        path: 'response',
        component: RespuestaCompraComponent
      },
    ]
  }
]