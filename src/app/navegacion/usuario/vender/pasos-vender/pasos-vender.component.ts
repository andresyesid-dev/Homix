import { Component } from '@angular/core';

@Component({
  selector: 'app-pasos-vender',
  templateUrl: './pasos-vender.component.html',
  styleUrls: ['./pasos-vender.component.scss']
})
export class PasosVenderComponent {

  public pasos = [
    {
      titulo: "Decide que vas a vender",
      contenido: "Todos tenemos nuestra parte artistica, conoce tus gustos y lanza a relucir tu arte. Puedes crecer tu inventario mientras vas generando más experiencias a tus clientes.",
      img: "assets/img/ilustraciones/paso-uno.svg"
    },
    {
      titulo: "Registrate",
      contenido: "Antes de vender, registrate con tus datos para tenerte en cuenta como un buen vendedor a futuro. Y así podrás recibir beneficios.",
      img: "assets/img/ilustraciones/paso-dos.svg"
    },
    {
      titulo: "Publica tus productos",
      contenido: "Encontrarás 6 pasos simples para la publicación de tu producto. Tendrás recomendaciones en cada punto para mejorar la experiencia de tus clientes.",
      img: "assets/img/ilustraciones/paso-tres.svg"
    },
    {
      titulo: "Genera ventas",
      contenido: "Podrás generar más ventas según el plan de Joum que decidas y tu calidad de atención a los clientes. Cuando generes ventas, te avisaremos al momento para que empieces tu proceso de preparación.",
      img: "assets/img/ilustraciones/paso-cuatro.svg"
    },
    {
      titulo: "Envia los productos",
      contenido: "Te daremos las instrucciones perfectas para que puedas guiarte y hacer un envío impecable. Ten en cuenta tomar fotos/videos cuando empeques el producto.",
      img: "assets/img/ilustraciones/paso-cinco.svg"
    },
  ];

}

