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
- **Recuperación de contraseña**: el usuario pide un código desde el login con su nombre de usuario; los admins que tengan su WhatsApp configurado (Mi Perfil) reciben una notificación con el código vía [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) (servicio gratuito de terceros, sin backend propio); se lo pasan al usuario, que lo captura junto con su nueva contraseña — el código queda inservible en cuanto se usa una vez.
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

## Dos proyectos de Firebase: producción y desarrollo

La app usa **dos proyectos de Firebase totalmente separados** (cada uno con su propio Firestore, sin compartir datos entre sí):

| | Proyecto | Firestore | Se usa cuando... |
|---|---|---|---|
| Producción | `mavikekas-690e0` | datos reales | build con `VITE_FIREBASE_ENV=production` (lo fija el workflow que despliega `main`) |
| Desarrollo | `mavikekas-dev-690e0` | datos de prueba | cualquier otro caso — default de `npm run dev` local y del canal de vista previa de `develop` |

`src/firebase.js` elige el `firebaseConfig` correcto según esa variable. Así, probar en local o en el sitio de `develop` nunca toca datos ni usuarios reales — ambos escriben en el Firestore de desarrollo, que se siembra solo la primera vez que corre (ver `src/utils/firestoreDB.js`).

Las reglas de Firestore del proyecto de desarrollo viven versionadas en `firestore.rules` y se despliegan aparte con:

```bash
npx firebase-tools deploy --only firestore:rules --project dev
```

**Las reglas de producción NO se tocan desde aquí** — se administran directamente en la consola de Firebase, a propósito, para que un deploy nunca las sobreescriba sin querer.

## Configuración (si conectas tu propio Firebase)

1. Crea uno o dos proyectos en [console.firebase.google.com](https://console.firebase.google.com) (uno solo si no necesitas separar dev/prod).
2. En **⚙️ → Configuración del proyecto → Tus apps**, copia el objeto `firebaseConfig` de cada uno.
3. Actualiza `FIREBASE_CONFIGS` en `src/firebase.js`.
4. Habilita **Firestore Database** en cada proyecto y ajusta sus reglas de seguridad.

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

### Despliegue automático (CI/CD)

Además del deploy manual, dos GitHub Actions (`.github/workflows/`) despliegan solos:

| Rama | Destino | Cuándo |
|---|---|---|
| `main` | Sitio de producción (`mavikekas-690e0.web.app`) | En cada push a `main` |
| `develop` | Canal de vista previa `develop` (URL propia, separada de producción) | En cada push a `develop` |

Así puedes probar en el canal de `develop` antes de mandar los cambios a `main`.

Requiere el secreto `FIREBASE_SERVICE_ACCOUNT` en **Settings → Secrets and variables → Actions** del repo (ver más abajo cómo generarlo).

## Licencia

Todos los derechos reservados. El código es visible con fines de consulta/portafolio, pero no está autorizado su uso, copia, modificación o redistribución sin permiso explícito.
