/**
 * firebase.js
 * Configuración e inicialización de Firebase para el proyecto Mavikekas.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyCjErsTlQe_HhqrORgoBKJDYHt5cOQuOEg",
  authDomain:        "mavikekas-690e0.firebaseapp.com",
  projectId:         "mavikekas-690e0",
  storageBucket:     "mavikekas-690e0.firebasestorage.app",
  messagingSenderId: "424163216492",
  appId:             "1:424163216492:web:79d4715c330182b9321c49",
};

export const CONFIG_FILLED = true;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
