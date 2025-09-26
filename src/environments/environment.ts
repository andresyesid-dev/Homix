import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyBndfuQhEY6BDKvU6IyYp_VRS_vX-sqDYM",
    authDomain: "joum-b86f6.firebaseapp.com",
    databaseURL: "https://joum-b86f6-default-rtdb.firebaseio.com",
    projectId: "joum-b86f6",
    storageBucket: "joum-b86f6.appspot.com",
    messagingSenderId: "708154280662",
    appId: "1:708154280662:web:d90e98e2855361888a5777",
    measurementId: "G-P9DJ0YX0Y2"
  }, 
  stripe: {
    key: 'pk_live_51NttnvIR0Fjtn6lAkTbFofKfbxkqLOVr0p5RNDXFBpaBB0nQgMkQMdXHFfmRbnCaLlKE1JPjNESDxwZOa9jOSzL700rRo2nACz'
  },
  mercadoPago: {
    // Reemplaza con tu clave pública de MercadoPago
    publicKey: 'TEST-1b090172-84d2-4f6c-8c13-bd9d2f4d64a1'
  }
};

const app = initializeApp(environment.firebase);
getStorage(app);