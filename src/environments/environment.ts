import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDZDf7ICSpwqp6N3GE1djGvKXq9lYCbg1o",
    authDomain: "homix0523.firebaseapp.com",
    projectId: "homix0523",
    storageBucket: "homix0523.firebasestorage.app",
    messagingSenderId: "460428051807",
    appId: "1:460428051807:web:6e545ba98f6adcc6d862ea",
    measurementId: "G-TVXB7QB3G5"
  }, 
  stripe: {
    key: 'pk_live_51NttnvIR0Fjtn6lAkTbFofKfbxkqLOVr0p5RNDXFBpaBB0nQgMkQMdXHFfmRbnCaLlKE1JPjNESDxwZOa9jOSzL700rRo2nACz'
  },
  mercadoPago: {
    // Reemplaza con tu clave pública de MercadoPago
    publicKey: 'TEST-1b090172-84d2-4f6c-8c13-bd9d2f4d64a1'
  }
};