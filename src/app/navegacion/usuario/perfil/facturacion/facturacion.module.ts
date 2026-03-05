import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule } from '@ng-icons/core';
import { 
  heroDocument, 
  heroChartBar, 
  heroArrowDownTray, 
  heroDocumentText,
  heroReceiptPercent
} from '@ng-icons/heroicons/outline';

import { FacturacionRoutingModule } from './facturacion-routing.module';
import { FacturasReportesComponent } from './facturas-reportes/facturas-reportes.component';
import { FacturaReporteComponent } from './facturas-reportes/componentes/factura-reporte/factura-reporte.component';
import { RetencionesComponent } from './retenciones/retenciones.component';
import { RetencionComponent } from './retenciones/componentes/retencion/retencion.component';
import { ComponentesGeneralesModule } from 'src/app/navegacion/componentes-generales/componentes-generales.module';

@NgModule({
  declarations: [
    FacturasReportesComponent,
    FacturaReporteComponent,
    RetencionesComponent,
    RetencionComponent
  ],
  imports: [
    CommonModule,
    FacturacionRoutingModule,
    ComponentesGeneralesModule,
    NgIconsModule.withIcons({ 
      heroDocument, 
      heroChartBar, 
      heroArrowDownTray, 
      heroDocumentText,
      heroReceiptPercent
    })
  ]
})
export class FacturacionModule { }
