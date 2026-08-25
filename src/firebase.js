/**
 * firebase.js
 * Configuración e inicialización de Firebase para el proyecto Mavikekas.
 *
 * Hay dos proyectos de Firebase completamente separados (cada uno con su
 * propio Firestore, sin compartir datos):
 *   - mavikekas-690e0      → producción (sitio real, datos reales)
 *   - mavikekas-dev-690e0  → desarrollo (para probar sin tocar datos reales)
 *
 * Cuál se usa depende de la variable de build VITE_FIREBASE_ENV:
 *   - "production" → producción (la fija el workflow que despliega `main`)
 *   - cualquier otro valor, incluido "no definida" → desarrollo (default
 *     seguro para `npm run dev` local y para el canal de vista previa de
 *     `develop`, así nunca se toca la base de datos real por accidente)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';

const FIREBASE_CONFIGS = {
  production: {
    apiKey:            "AIzaSyCjErsTlQe_HhqrORgoBKJDYHt5cOQuOEg",
    authDomain:        "mavikekas-690e0.firebaseapp.com",
    projectId:         "mavikekas-690e0",
    storageBucket:     "mavikekas-690e0.firebasestorage.app",
    messagingSenderId: "424163216492",
    appId:             "1:424163216492:web:79d4715c330182b9321c49",
  },
  development: {
    apiKey:            "AIzaSyBPJrIbJ3GtZUNgA5rk5auGfEVcDfJhCrY",
    authDomain:        "mavikekas-dev-690e0.firebaseapp.com",
    projectId:         "mavikekas-dev-690e0",
    storageBucket:     "mavikekas-dev-690e0.firebasestorage.app",
    messagingSenderId: "344728968429",
    appId:             "1:344728968429:web:87209fb38eb42f714480e4",
  },
};

const isProduction = import.meta.env.VITE_FIREBASE_ENV === 'production';
export const FIREBASE_ENV = isProduction ? 'production' : 'development';

const firebaseConfig = FIREBASE_CONFIGS[FIREBASE_ENV];

export const CONFIG_FILLED = true;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
