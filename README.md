# Mavikekas

Sistema interno de pedidos de tacos (martes) y quesadillas (viernes), con panel de administración y backend en tiempo real sobre Firebase/Firestore.

## Stack

- **React 18** + **Vite** — interfaz y build
- **Tailwind CSS** — estilos
- **Firebase Firestore** — base de datos en tiempo real (usuarios, catálogos, pedidos, estado global)
- **Firebase Hosting** — despliegue del sitio

No hay backend propio: toda la lógica corre en el navegador y la única pieza compartida entre usuarios es Firestore.

## Funcionalidad

- **Pedidos**: los usuarios levantan su pedido del día (tacos o quesadillas según el día/horario activo), pueden guardar una orden por defecto, modificarla o eliminarla mientras el servicio sigue abierto.
- **Panel de administración**: control manual del servicio (encendido/apagado), gestión de usuarios y roles, catálogo de sabores (con flag de "admite queso"), consolidado del día con reporte listo para copiar a WhatsApp y eliminación de pedidos individuales.
- **Cumpleaños**: cada usuario puede tener día/mes de cumpleaños y pastel favorito; se muestran en un widget en el inicio, con una card destacada y un modal de felicitación el día que corresponde, más un recordatorio después de hacer un pedido si falta algún dato.
- **Auto-registro**: un admin genera un código de invitación de un solo uso desde el panel; con ese código, cualquiera puede crear su propia cuenta desde la pantalla de login.
- **Simulador de tiempo** (solo admin): permite simular día, hora y fecha para probar la lógica de horario de servicio y cumpleaños sin esperar a que ocurran de verdad.

## Estructura del proyecto

```
src/
├── components/
│   ├── admin/       Panel de administración (usuarios, catálogos, consolidado, códigos)
│   ├── auth/        Login y auto-registro
│   ├── birthdays/   Widgets y modal de cumpleaños
│   ├── orders/       Formulario de pedido, resumen, recordatorio de perfil
│   ├── profile/      Mi Perfil (usuario, contraseña, órdenes por defecto)
│   └── shared/       Header, selector de cumpleaños, simulador de tiempo
├── context/          Estado global (AppContext, sobre useReducer + listeners de Firestore)
├── utils/            Firestore, fechas, reportes, almacenamiento local de sesión
├── assets/birthday/  Imagen usada en las felicitaciones de cumpleaños
└── firebase.js       Configuración e inicialización de Firebase
```

## Requisitos previos

- Node.js 18+
- Un proyecto de Firebase con **Firestore** habilitado

## Configuración

1. Crea (o usa) un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. En **⚙️ → Configuración del proyecto → Tus apps**, copia el objeto `firebaseConfig`.
3. Pégalo en `src/firebase.js`.
4. Habilita **Firestore Database** en el proyecto (modo producción o pruebas, según prefieras) y ajusta las reglas de seguridad.

La primera vez que la app corre contra un Firestore vacío, siembra automáticamente catálogos y un usuario administrador de prueba (ver `src/utils/firestoreDB.js`) — cambia esas credenciales antes de usar la app con datos reales.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

## Build y despliegue

```bash
npm run build
npx firebase-tools deploy
```

Requiere tener el proyecto correcto seleccionado en `.firebaserc` y sesión iniciada con `firebase login`.

Si usas Claude Code, el skill `deploy-mavikekas` (`.claude/skills/deploy-mavikekas/`) hace ambos pasos en uno.

## Licencia

Todos los derechos reservados. El código es visible con fines de consulta/portafolio, pero no está autorizado su uso, copia, modificación o redistribución sin permiso explícito.
