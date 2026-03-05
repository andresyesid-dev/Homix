import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Usuario } from 'src/app/interfaces/usuario/usuario';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { provideIcons } from '@ng-icons/core';
import { heroShieldCheck, heroStar, heroShoppingBag, heroCheckCircle, heroExclamationTriangle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-reputacion',
  templateUrl: './reputacion.component.html',
  styleUrls: ['./reputacion.component.scss'],
  providers: [provideIcons({ heroShieldCheck, heroStar, heroShoppingBag, heroCheckCircle, heroExclamationTriangle })]
})
export class ReputacionComponent implements OnInit, OnDestroy {
  usuario!: Usuario;
  datosCargados = false;
  subscripcionParams!: Subscription;
  db = getFirestore();

  // Reputación metrics
  calificacionPromedio: number = 0;
  totalVentas: number = 0;
  ventasExitosas: number = 0;
  reclamos: number = 0;
  nivel: string = 'Nuevo';

  constructor(
    private activatedRoute: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.subscripcionParams = this.activatedRoute.parent!.params.subscribe((params) => {
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
        this.calcularMetricas();
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    } finally {
      this.datosCargados = true;
    }
  }

  calcularMetricas() {
    // Calculate reputation metrics from user data
    if (this.usuario.opiniones && this.usuario.opiniones.length > 0) {
      // This would need actual opinion data to calculate properly
      this.calificacionPromedio = 4.5; // Placeholder
    }
    
    if (this.usuario.ventas) {
      this.totalVentas = this.usuario.ventas.length || 0;
    }
    
    // Calculate nivel based on metrics
    if (this.totalVentas > 100) {
      this.nivel = 'Platinum';
    } else if (this.totalVentas > 50) {
      this.nivel = 'Gold';
    } else if (this.totalVentas > 20) {
      this.nivel = 'Silver';
    } else if (this.totalVentas > 5) {
      this.nivel = 'Bronze';
    }
  }
}
