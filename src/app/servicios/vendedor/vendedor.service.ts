import { Injectable } from '@angular/core';
import { Firestore, getDoc } from '@angular/fire/firestore';
import { Usuario } from 'src/app/interfaces/usuario/usuario';

@Injectable({
  providedIn: 'root'
})
export class VendedorService {

  constructor(private firestore: Firestore) { }

  /**
   * Verifica si un usuario es un vendedor activo
   * Un vendedor activo es aquel que tiene al menos un producto publicado con estado: true
   * @param usuario - El objeto usuario a verificar
   * @returns Promise<boolean> - true si es vendedor activo, false en caso contrario
   */
  async esVendedorActivo(usuario: Usuario): Promise<boolean> {
    try {
      // Verificar si el usuario tiene publicaciones
      if (!usuario.publicaciones || usuario.publicaciones.length === 0) {
        return false;
      }

      // Obtener todos los productos del usuario
      const productosSnapshot = await Promise.all(
        usuario.publicaciones.map(ref => getDoc(ref))
      );
      
      // Verificar si al menos un producto está activo (estado: true)
      const tieneProductoActivo = productosSnapshot.some(productoSnapshot => {
        if (productoSnapshot.exists()) {
          const producto = productoSnapshot.data();
          return producto && producto['estado'] === true;
        }
        return false;
      });
      
      return tieneProductoActivo;
    } catch (error) {
      console.error('Error verificando si es vendedor activo:', error);
      return false;
    }
  }

  /**
   * Cuenta el número de productos activos de un usuario
   * @param usuario - El objeto usuario
   * @returns Promise<number> - Cantidad de productos activos
   */
  async contarProductosActivos(usuario: Usuario): Promise<number> {
    try {
      if (!usuario.publicaciones || usuario.publicaciones.length === 0) {
        return 0;
      }

      const productosSnapshot = await Promise.all(
        usuario.publicaciones.map(ref => getDoc(ref))
      );
      
      const productosActivos = productosSnapshot.filter(productoSnapshot => {
        if (productoSnapshot.exists()) {
          const producto = productoSnapshot.data();
          return producto && producto['estado'] === true;
        }
        return false;
      });
      
      return productosActivos.length;
    } catch (error) {
      console.error('Error contando productos activos:', error);
      return 0;
    }
  }
}
