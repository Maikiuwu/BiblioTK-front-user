# BiblioTK-front-user — App del rol `usuario` (lector)

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Inicio, catálogo con préstamos, "Mis préstamos" y perfil para el rol `usuario`. React 19 + React Router 7 + Vite 8 + Tailwind CSS 4 + Zod (validación del perfil).

- **Arranque:** `npm run dev` → http://localhost:5173 (`VITE_PORT` en `.env.local`; `vite.config.js` lo lee con `loadEnv`)
- **Docker:** `Dockerfile` en dos etapas (compila con Vite → nginx sin root con `nginx.conf`). Las `VITE_*` quedan fijas al compilar: por defecto, detrás del gateway de `../InfraBiblioTK` (rutas relativas, un solo origen) y con la subruta `/lector/`. `VITE_BASE` es esa subruta (`base` de Vite y `basename` del router; en desarrollo, `/`).
- **Librería de interfaz:** `bibliotk-ui` **de npm** (`^0.4.0`, publicada desde el repo `UiBiblioTK`), con JS y CSS ya compilados. `CoverImage` viene de ahí. Usar solo lo que exporta npm.
- **CSS:** `src/app/styles/globals.css`, enlazado con `<link>` en `index.html` (no se importa desde `main.jsx`): fuentes + `bibliotk-ui/styles.css` + solo `theme` y `utilities` de Tailwind. Ver `../UiBiblioTK/CLAUDE.md`.
- **Íconos:** un import por ícono (`@phosphor-icons/react/Books`); ESLint prohíbe el paquete entero. `IconContext` sale de `@phosphor-icons/react/dist/lib/context`.
- **Carga:** `Home` va en el paquete inicial; Catálogo, Préstamos y Perfil (con Zod) se cargan con `React.lazy` y se precargan cuando el navegador queda libre. La sesión se pide al cargar `App.jsx`.
- **Acceso:** solo cuentas de lector, pero el front nunca ve el rol: `App.jsx` consulta `GET /Sesion` (sin caché) y `esSesionDeEstaApp` (`LoginService.js`) compara el origen del `destino` que devuelve con el de esta app. Sin sesión o con una cuenta de otra app se reemplaza (`location.replace`) por la landing con `?motivo=sesion_expirada|sin_permiso`; al cerrar sesión o borrar la cuenta (`?motivo=cuenta_eliminada`) también se usa `replace`, para que "atrás" no vuelva al panel. La sesión se vuelve a consultar cada vez que la página vuelve a mostrarse (restaurada del bfcache con "atrás", o al volver a la pestaña) y al salir la página se oculta, así no se alcanza a ver si la sesión ya no existe. La URL se arma con `new URL(ruta, VITE_LOGIN_APP_URL)` porque esa variable puede venir con `/` final.

## Estructura

```
src/
  app/
    pages/
      App.jsx        # Rutas (secciones con React.lazy), guarda de sesión, PanelLayout (Inicio, Catálogo, Préstamos, Mi perfil)
      Home.jsx        # /HomeUser — Libros (→ catálogo), Mi perfil (un solo botón), Préstamos, Reportes (próximamente)
      Catalogo.jsx    # /catalogo — portadas, búsqueda, filtros y "Pedir préstamo"
      Prestamos.jsx   # /prestamos — Mis préstamos: en curso e historial
      Profile.jsx     # /perfil — "Editar mis datos" + "Eliminar mi cuenta"
    dto/updateProfile.dto.js
    utils/userValidation.js    # Esquema Zod del perfil (sin contraseña)
    styles/globals.css         # Hoja única (se enlaza desde index.html) + barra de PanelLayout pegada arriba (.btk-panel__header)
  service/
    LoginService.js       # getCurrentSession, esSesionDeEstaApp, logoutUser → :3001
    NotificacionesService.js # conectarNotificaciones → :3006 (Socket.IO)
    ProfileService.js     # getProfile, updateProfile, deleteAccount → :3002 (PerfilBiblioTK)
    MaterialesService.js  # listMateriales → :3003 (MaterialesBiblioTK, lectura pública)
    PrestamosService.js   # createPrestamo, listMisPrestamos → :3005 (PrestamosBiblioTK)
```

Variables opcionales (`.env.local`): `VITE_PORT`, `VITE_NOTIFICACIONES_URL`, `VITE_LOGIN_APP_URL`, `VITE_SESSION_URL`, `VITE_LOGOUT_URL`, `VITE_PROFILE_URL`, `VITE_MATERIALES_URL`, `VITE_PRESTAMOS_URL`. Sin ellas se usan los valores por defecto de cada servicio.

## Préstamos

- **Catálogo:** al confirmar "Pedir préstamo" se llama a `POST /Prestamos`; el diálogo pasa a "¡Préstamo registrado!" con el mensaje **"Recoge el libro físico en el Poli, baños P40, sexto piso."** (el lugar lo manda el backend en `recogida`) y la fecha límite. Si el backend rechaza (vencidos, máximo de 3, ya prestado) el mensaje sale en el mismo diálogo.
- **Mis préstamos:** lee `GET /Prestamos/mios`; las portadas salen del catálogo (`listMateriales`) por `materialId`.

## Perfil

El inicio tiene **un solo botón, "Editar perfil"**; dentro de `/perfil` están las dos opciones: el formulario "Editar mis datos" y la sección "Eliminar mi cuenta" (pide la contraseña; el backend bloquea si hay préstamos sin devolver).

## Portadas (`CoverImage` de `bibliotk-ui`)

Cada material puede traer `imagenUrl` (Cloudinary u otra URL) e `imagenLocal` (archivo servido por MaterialesBiblioTK). Se intenta primero la remota —si es una subida propia a Cloudinary se pide optimizada con `f_auto,q_auto`— y, si falla, la local; sin ninguna, una portada de color con el título.

## Notificaciones en tiempo real

- `src/service/NotificacionesService.js` abre el socket de `NotificacionesBiblioTK` (`/NotificacionesBiblioTK/socket.io`, solo WebSocket) con la cookie de sesión: el servidor decide qué recibe la cuenta, el front no conoce el rol. `VITE_NOTIFICACIONES_URL` (por defecto `http://localhost:3006`; vacía = mismo origen, detrás del gateway).
- `src/app/hooks/useNotificaciones.js` guarda el historial (20, el que manda el servidor al conectar), los avisos emergentes (máximo 3) y las no leídas (marca "leídas hasta" en `localStorage`, por navegador). Se conecta cuando la sesión ya se validó; si el servidor corta el socket (sesión cerrada en otra pestaña, cuenta borrada), revalida la sesión y vuelve a la landing.
- Si el servidor corta el socket porque a la cuenta le cambiaron el rol, la revalidación encuentra la sesión viva pero de otra app y la lleva a su `destino` (la app del rol nuevo).
- `App.jsx` pinta `NotificationCenter`: botón flotante abajo a la derecha con contador, panel con el historial y avisos arriba a la derecha.
- `NotificationCenter` (y su CSS, dentro de `bibliotk-ui/styles.css`) viene de `bibliotk-ui` ^0.4.0.

## Pendientes conocidos

- La cabecera muestra el correo que devolvió `/Sesion` al cargar: tras cambiarlo en `/perfil` sigue mostrando el anterior hasta recargar la página.
- `README.md` sigue siendo la plantilla por defecto de Vite.
