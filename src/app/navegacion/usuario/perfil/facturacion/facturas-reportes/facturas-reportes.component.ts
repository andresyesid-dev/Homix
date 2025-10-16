import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

interface FacturaReporte {
  id?: string;
  fecha?: any;
  tipo: 'factura' | 'reporte';
  periodo?: string;
  monto?: number;
  estado?: 'pendiente' | 'procesado' | 'completado';
  descripcion?: string;
}

@Component({
  selector: 'app-facturas-reportes',
  templateUrl: './facturas-reportes.component.html',
  styleUrls: ['./facturas-reportes.component.scss']
})
export class FacturasReportesComponent implements OnInit, OnDestroy {
  usuario!: Usuario;
  datosCargados = false;
  subscripcionParams!: Subscription;
  db = getFirestore();

  facturasReportes: FacturaReporte[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.subscripcionParams = this.activatedRoute.parent!.parent!.params.subscribe((params) => {
      this.obtenerUsuario(params['id']);
    });
  }

  ngOnDestroy(): void {
    if (this.subscripcionParams) {
      this.subscripcionParams.unsubscribe();
    }
  }

  async obtenerUsuario(uid: string) {
    try {
      const userDocRef = doc(this.db, 'usuarios', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        this.usuario = userSnapshot.data() as Usuario;
        await this.obtenerFacturasReportes();
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    } finally {
      this.datosCargados = true;
    }
  }

  async obtenerFacturasReportes() {
    // Placeholder - would load from Firestore in real implementation
    this.facturasReportes = [];
  }
}
