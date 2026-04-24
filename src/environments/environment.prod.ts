import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyDZDf7ICSpwqp6N3GE1djGvKXq9lYCbg1o",
    authDomain: "homix0523.firebaseapp.com",
    projectId: "homix0523",
    storageBucket: "homix0523.firebasestorage.app",
    messagingSenderId: "460428051807",
    appId: "1:460428051807:web:6e545ba98f6adcc6d862ea",
    measurementId: "G-TVXB7QB3G5"
  }, 
  mercadoPago: {
    // Reemplaza con tu clave pública de producción de MercadoPago
    publicKey: 'APP_USR-your-production-public-key-here'
  }
};