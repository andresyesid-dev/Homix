import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FacturasReportesComponent } from 'src/app/navegacion/usuario/perfil/facturacion/facturas-reportes/facturas-reportes.component';
import { RetencionesComponent } from 'src/app/navegacion/usuario/perfil/facturacion/retenciones/retenciones.component';

const routes: Routes = [
  { path: '', redirectTo: 'facturas-reportes', pathMatch: 'full' },
  { path: 'facturas-reportes', component: FacturasReportesComponent },
  { path: 'retenciones', component: RetencionesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FacturacionRoutingModule { }
