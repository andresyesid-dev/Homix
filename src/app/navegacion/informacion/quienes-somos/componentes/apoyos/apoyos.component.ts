import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Functions, connectFunctionsEmulator, httpsCallable } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { heroQuestionMarkCircle } from '@ng-icons/heroicons/outline';
import { heroXMark } from '@ng-icons/heroicons/outline';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-apoyos',
  templateUrl: './apoyos.component.html',
  styleUrls: ['./apoyos.component.scss'],
  providers: [provideIcons({heroQuestionMarkCircle, heroXMark})]
})

export class ApoyosComponent {
  constructor( private functions: Functions, private activatedRoute: ActivatedRoute, private router: Router) {}
  @ViewChild('puntos', { static: false }) puntos!: ElementRef;
  enviarSugerencia = false;
  enviarApoyo = false;
  cargando = false;
  divWidth = 470;
  cantidades = [0, 9.09, 18.18, 27.27, 36.36, 45.45, 54.54, 63.63, 72.72, 81.81, 90.9, 100];
  porcentajeSeleccionado = "0%";
  precio = 4000;
  indexSeleccionado = 0;
  mouseDown = false;
  success = false;

  async ngOnInit() {
    this.getStripeStatus();
    if (environment.production === false) {
        connectFunctionsEmulator(this.functions, "localhost",  5001);
    }           
  }

  getStripeStatus() {
    let action = this.activatedRoute.snapshot.queryParamMap.get('action');              // ex: '/home?action=success'
    if (action && action == 'success'){
      this.success = true;
    }
        
  }


  donar(): void {
    if(!this.cargando){
      this.cargando = true;
      setTimeout(()=>{ this.cargando = false; }, 1500);
    }
  }

  @HostListener('document:click')
  cerrarVentanas() {
    if((this.enviarSugerencia || this.enviarApoyo || this.success) && !this.mouseDown){
      this.enviarSugerencia = false;
      this.enviarApoyo = false;
      this.porcentajeSeleccionado = "0%";
      this.precio = 4000;
      this.indexSeleccionado = 0;
      if(this.success){
        this.router.navigate(['quienes-somos']);
        this.success = false;
      }
    }
  }

  cambiar(porcentaje: number, index: number){
    this.indexSeleccionado = index;
    this.porcentajeSeleccionado = porcentaje + '%';
    switch(index) {
      case 0:
        this.precio = 4000;
        break;
      case 1:
        this.precio = 10000;
        break;
      case 2:
        this.precio = 20000;
        break;
      case 3:
        this.precio = 30000;
        break;
      case 4:
        this.precio = 40000;
        break;
      case 5:
        this.precio = 50000;
        break;
      case 6:
        this.precio = 100000;
        break;
      case 7:
        this.precio = 150000;
        break;
      case 8:
        this.precio = 200000;
        break;
      case 9:
        this.precio = 400000;
        break;
      case 10:
        this.precio = 800000;
        break;
      case 11:
        this.precio = 950000;
        break;
    }
    
  }
  
  onMouseMove(event: MouseEvent) {
    if (this.mouseDown) {
      document.body.style.userSelect = 'none';
        const mouseX = event.clientX;
        for (let i = 0; i < this.cantidades.length; i++) {
            const div = this.puntos.nativeElement.children[i];
            const rect = div.getBoundingClientRect();
            const divLeft = rect.left + window.scrollX;
            const divRight = rect.right + window.scrollX;
            if (mouseX >= divLeft && mouseX <= divRight) {
                this.cambiar(this.cantidades[i], i);
                break;
            }
        }
    }
  }
  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(event: MouseEvent) {  
    setTimeout(()=>{
      this.mouseDown = false;
    },10)
  }
}
