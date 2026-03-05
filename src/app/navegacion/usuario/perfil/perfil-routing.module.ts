import { Routes } from '@angular/router';
import { PerfilComponent } from './perfil.component';

import { PerfilUsuarioComponent } from './perfil/perfil-usuario.component';
/*---------  Secciones Perfil Usuario  -----------*/
  import { InformacionComponent } from './perfil/secciones/informacion/informacion.component';

import { ComprasComponent } from './compras/compras/compras.component';
  import { DetalleCompraComponent } from './compras/compras/detalle-compra/detalle-compra.component';
import { FavoritosComponent } from './compras/favoritos/favoritos.component';
import { MetricasComponent } from './ventas/metricas/metricas.component';
/*---------  Secciones Métricas  -----------*/
  import { NegocioComponent } from './ventas/metricas/secciones/negocio/negocio.component';
  import { AtencionCompradoresComponent } from './ventas/metricas/secciones/atencion-compradores/atencion-compradores.component';
  import { StockComponent } from './ventas/metricas/secciones/stock/stock.component';
import { PublicacionesComponent } from './ventas/publicaciones/publicaciones.component';
import { VentasComponent } from './ventas/ventas/ventas.component';
import { TuDineroComponent } from './perfil/secciones/tu-dinero/tu-dinero.component';
import { OpinionesComponent } from './compras/opiniones/opiniones.component';
import { NovedadesComponent } from './ventas/novedades/novedades.component';
import { ReputacionComponent } from './ventas/reputacion/reputacion.component';
import { EditarPublicacionComponent } from './ventas/publicaciones/editar-publicacion/editar-publicacion.component';

/*---------  Secciones facturación  -----------*/

  export const routes: Routes = [
  {
    path: ':id',
    component: PerfilComponent,
    children: [
      {/*---------------  Perfil -----------*/
        path: 'perfil',
        component: PerfilUsuarioComponent,
        children: [
          {
            path: 'informacion',
            component: InformacionComponent
          }
        ]
      },
      /*-----------------------------------------*/
      {
        path: 'compras',
        component: ComprasComponent
      },
      {
        path: 'compras/detalle-compra/:id',
        component: DetalleCompraComponent
      },
      {
        path: 'favoritos',
        component: FavoritosComponent
      },
      {
        path: 'opiniones',
        component: OpinionesComponent
      },/*-----------------------------------------*/
      {
        path: 'metricas',
        component: MetricasComponent,
        children: [
          {
            path: 'negocio',
            component: NegocioComponent
          },
          {
            path: 'atencion-compradores',
            component: AtencionCompradoresComponent
          },
          {
            path: 'stock',
            component: StockComponent
          }
        ]
      },
      {
        path: 'publicaciones',
        component: PublicacionesComponent
      },
      {
        path: 'editar-publicacion/:id',
        component: EditarPublicacionComponent
      },
      {
        path: 'tu-dinero',
        component: TuDineroComponent
      },
      {
        path: 'novedades',
        component: NovedadesComponent
      },
      {
        path: 'reputacion',
        component: ReputacionComponent
      },

      /*------- Seccion Ventas-------*/
      {
        path: 'ventas',
        component: VentasComponent
      },
      /*------- Seccion Facturación-------*/
      {
        path: 'facturacion',
        loadChildren: () => import('./facturacion/facturacion.module').then(m => m.FacturacionModule)
      },

    ]
  }
    
]