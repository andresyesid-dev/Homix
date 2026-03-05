import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
declare const ShopifyBuy: any;

@Component({
  selector: 'app-boton-carrito',
  templateUrl: './boton-carrito.component.html',
  styleUrls: ['./boton-carrito.component.scss']
})
export class BotonCarritoComponent {
  @ViewChild('contenedor', { static: true }) contenedor!: ElementRef;
  @Input() id!: string;
  @Input() variante!: string;
  @Input() idDocumento!: string;
  porBorrar: boolean = false;

  async ngOnChanges(changes: SimpleChanges) {
    const elementoPadre = this.contenedor.nativeElement;
    const primerHijo = elementoPadre.firstChild; // Obtén el primer hijo
    if (primerHijo) {
      elementoPadre.removeChild(primerHijo); // Elimina el primer hijo del DOM
    }
    if (changes['id'] && changes['id'].currentValue || changes['variante']) {
      if(this.porBorrar){
        await this.generarBoton();
      }else{
        await this.generarBoton();
        this.porBorrar = true;
      }
    }
  }
  async generarBoton(){
    setTimeout(async ()=>{
      this.idDocumento = `${this.idDocumento}`;
      const client = await ShopifyBuy.buildClient({
        domain: '401991-9d.myshopify.com',
        storefrontAccessToken: '53d479aed268ee05ce56f5bcbcb2bba7',
      });

      let ui: any =  await ShopifyBuy.UI.onReady(client);
      await ui.createComponent('product', {
        id: this.id,
        variantId: this.variante,
        node: document.getElementById(`${this.idDocumento}`),
        moneyFormat: '%24%7B%7Bamount_with_comma_separator%7D%7D',
        lineItem: {
          quantity: 5 // Aquí establece la cantidad predeterminada
        },
        options: {
          product: {
            styles: {
              button: {
                "width": "1000px",
                "height": "43px",
                "line-height": "14px",
                "font-weight": "510",
                "font-size": "16px",
                "color": "#FF9C59",
                "letter-spacing": ".8px",
                "font-family": "verdana",
                "border": "1.5px solid #ffa86a",
                "transform": "translateY(-5px)",
                ":hover": {
                  "background-color": "#fff8f4"
                },
                "background-color": "#fffefd",
                ":focus": {
                  "background-color": "#fff8f4"
                },
                "border-radius": "5px",
              },
            },
            buttonDestination: "cart",
            contents: {
              "img": false,
              "title": false,
              "price": false
            },
            text: {
              "button": "Agregar al carrito"
            }
          },
          option: {
            contents: false
          }
        },
      });
    },700)
  }
}




