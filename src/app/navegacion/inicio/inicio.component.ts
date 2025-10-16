import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, addDoc, arrayUnion, collection, doc, getDocs, increment, limit, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Producto } from 'src/app/interfaces/producto/producto';
import { ProductosService } from 'src/app/servicios/productos/productos.service';
import { AuthService } from 'src/app/servicios/usuarios/auth.service';

@Component({
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit, OnDestroy{
  constructor( private auth: Auth, private router: Router, private prdService: ProductosService, private authService: AuthService, private firestore: Firestore){}
  carruselUno!: Producto[];
  carruselDos!: Producto[];
  carruselTres!: Producto[];
  enUsuario!: boolean;
  usuarioNuevo = false;

  anchoPagina: number = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.anchoPagina = event.target.innerWidth;
  }
  
  ngOnInit(){
    //this.router.navigate(['prod/0MDi2sGNF4mLVTzaQJpD'])
    if(this.authService.usuarioNuevo){
      this.usuarioNuevo = true;
    }
    this.auth.onAuthStateChanged((user)=>{
      user ? this.enUsuario = true : this.enUsuario = false;
    })
    this.obtenerProductos();
    this.obtenerVistas();
    //this.crearProducto()
    //this.asignarDetalles();
  }

  async obtenerVistas(){
    setTimeout(async ()=>{
      if(!this.auth.currentUser){
        await updateDoc(doc(this.firestore, 'cookies/informacion'), {vistas: increment(1)});
      }
    }, 2000)
  }

  async crearProducto(){
    const producto = {
      categoria: 'Macetas',
      precio: 28000,
      precioComparacion: 28000,
      precioEnvio: 9600,
      descuento: false,
      nombre: "Matera Maceta 3u Exterior Pequeñas Jardin Decoracion Plantas",
      descripcion: 'Matera rígida elaborada en plástico (PP) para sembrar, cuidar e hidratar sus plantas. Su diseño versátil permite utilizarla como porta materas o una matera común. Ideal para espacios pequeños o apartamentos.<br><br>Largo: 16,7 CM<br>Diámetro: 14 CM<br>Radio: 7 CM<br><br>Le damos una segunda oportunidad al plástico para crear materas de primera.',
      detalles: [
        'Diámetro de boca: 14 cm',
        'Diámetro de base: 9 cm',
        'Altura x Ancho x Largo: 17 cm x 12 cm x 15 cm',
        'Capacidad en volumen: 0.15L',
        'Material: Plastico recuperado',
        'Unidades por compra: 3'
      ],
      fotos: ['d3', 'd3-2', 'd3-3', 'd3-4', 'd3-5', 'd3-6'],
      /*
      estilos: [
        { fotos: ['d1-01', 'd1-01-2', 'd1-3', 'd1-4'], estilo: 'Médico' },
        { fotos: ['d1-02', 'd1-02-2', 'd1-02-2', 'd1-3', 'd1-4'], estilo: 'Café' },
        { fotos: ['d1-03', 'd1-03-2', 'd1-03-3', 'd1-3', 'd1-4'], estilo: 'Celular' },
        { fotos: ['d1-04', 'd1-04-2', 'd1-04-3', 'd1-3', 'd1-4'], estilo: 'Corazón' },
        { fotos: ['d1-05', 'd1-05-2', 'd1-3', 'd1-4'], estilo: 'Computadora' }
      ], */
      soloPorHoy: false,
      masVendido: false,
      enFavorito: 85,
      envioGratis: false,
      estado: true,
      idUsuario: 'zxVEEQ9rUOXM9k0zFPhDm8AWKTe2',
      ventas: 12
    }
    const ProductoRef = await addDoc(collection(this.firestore, 'productos'), producto);

    updateDoc(doc(this.firestore, 'usuarios/zxVEEQ9rUOXM9k0zFPhDm8AWKTe2'), {publicaciones: arrayUnion(ProductoRef)});
  }

  async asignarDetalles(){
    const queri = collection(this.firestore, 'productos');
    const snapshot = await getDocs(queri);
    const productos = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Producto));
    const seccion = productos.filter(producto => producto.nombre == 'Humidificador Difusor Aromas Chimenea Esencia Aromaterapia');
    seccion.forEach(prod => {
      const productoRef = doc(this.firestore, `productos/${prod.id}`);
      //const descripcion = 'Complementa tu nutrición con el Batido Nutricional Fórmula 1 de Herbalife Nutrition con proteína de soya, fibra, vitaminas y minerales para ayudar a nutrir tu cuerpo y a sentirte satisfecho y con energía. <br><br>Beneficios clave<br>• Alimento que ayuda a nutrir su cuerpo.<br>• Contiene vitaminas, minerales, proteína de soya y fibra.<br>• Incluye las vitaminas antioxidantes C y E.<br>• Provee 10gr de proteína por porción*.<br><br>Este delicioso Batido Nutricional Fórmula de Herbalife Nutrition contiene proteína de soya (10 gramos por porción*), fibra, vitaminas y minerales.<br><br>Una porción de Batido Nutricional Fórmula 1 en agua tiene sólo 90 Calorías y 1 gramo de grasa. Cuando se mezcla con un vaso (240ml) de leche descremada, aporta 170 Calorías.<br><br>Uso del Producto<br>Agite suavemente el envase varias veces antes de abrirlo. Mezcle o revuelva 2 cucharas medidoras (25 g) de fórmula 1 con 1 vaso (240 ml) de leche descremada o su bebida favorita.';
      //updateDoc(productoRef, {estilos: estilos});
  
      updateDoc(productoRef, { opiniones: [
          {
            calificacion: 5,
            fecha: this.definirFecha(2),
            contenido: 'Me encantó y todo el mundo en la casa y los que vienen quedan fascinados jejeje excelente tal cual como lo imaginé.',
            check: true,
            foto: 'f2-1'
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(2),
            contenido: 'Es muy lindo y estético, justo lo que estaba buscando.',
            check: true,
            foto: 'f2-2'
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(5),
            contenido: 'Todo muy bien.',
            check: true,
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(9),
            contenido: 'Excelente producto, 100% recomendado. Parece mucho mas costoso.',
            check: true,
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(9),
            contenido: 'Muy bien, el diseño y los leds le dan esa aura a chimenea mini, compraré más fragancias, contento con la compra.',
            check: true,
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(10),
            contenido: 'Excelente, es pequeño, minimalista, promete lo cumplido.',
            check: true,
            foto: 'f2-3'
          },
          {
            calificacion: 5,
            fecha: this.definirFecha(8),
            contenido: 'Excelente producto.',
            check: true
          }
        ]}
        );
        
    });

    //const productoRef = doc(this.firestore, `productos/${producto[0].id}`);
    //const detalles = [
    //  'Formato de venta: Pack ',
    //  'Unidades por Pack: 3',
    //  'Tipo del piel: Normal ',
    //  'Programa: Piel normal a Seca',
    //  'Línea: Cuidado Facial ',
    //  'Zona de aplicación: Rostro',
    //];
    //const descripcion = 'Práctico programa de tres pasos con el que le dará a su piel el cuidado básico que necesita: Limpia, tonifica y humecta.<br><br>Skin es la nueva línea de cuidado facial con una fórmula avanzada para todo tipo de piel de hombres y mujeres.<br><br>Beneficios clave<br>• Productos clínicamente probados.<br><br>Productos<br><br>• Herbalife Skin Limpiador Relajante de Sábila: Suave limpiador enriquecido con sábila que retira cuidadosamente el exceso de grasa, las impurezas y el maquillaje, dejando la piel limpia y despejada.<br><br>• Herbalife Skin Tonificador Energizante de Hierbas: Tonificador a base de ingredientes botánicos que proporciona hidratación y deja la piel limpia y fresca, sin sensación de sequedad ni escozor.<br><br>• Herbalife Skin Crema Renovadora de Noche: Esta crema rica y lujosa ayuda a proporcionar la hidratación que tanto necesita la piel durante la noche<br><br>';
    //updateDoc(productoRef, {detalles: detalles, descripcion: descripcion}); 
  }

  async obtenerProductos(){
    const queri = query(collection(this.firestore, 'productos'), orderBy('enFavorito', 'desc'));
    const snapshot = await getDocs(queri);
    const productos = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Producto));

    this.carruselUno = productos;
    this.carruselDos = productos.filter(producto => producto.soloPorHoy);
    this.carruselTres = productos.filter(producto => producto.categoria == 'Cuadros');
  }
 //-----------------

 definirFecha(diasAnteriores: number){
    let hoy = new Date();
    let fecha = new Date();
    fecha.setDate(hoy.getDate() - diasAnteriores);
    return fecha
  }

  slider = [
    'assets/img/anuncios/pagoContraEntrega.png',
    'assets/img/anuncios/detalles.png'
  ];

  navegar(): void{
    if(this.enUsuario){
      this.router.navigate(['vender']);
    }else{
      this.router.navigate(['cuenta/crear-cuenta']);
    }
    window.scroll(0,0)
  }

  link(ruta: string){
    this.router.navigate([ruta]);
    window.scroll(0,0)
  }

  ngOnDestroy(): void {
    if(this.authService.usuarioNuevo){
      this.authService.usuarioNuevo = false;
    }
  }
}