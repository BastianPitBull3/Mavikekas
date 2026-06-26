/**
 * main.jsx
 * Punto de entrada de React. Monta la aplicación dentro de #root
 * y envuelve todo con el proveedor de contexto global.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AppProvider inicializa y expone el estado global a todos los componentes */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
