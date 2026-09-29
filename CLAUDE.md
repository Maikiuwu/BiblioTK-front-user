# BiblioTK-front-user — App del rol `usuario` (lector)

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Inicio, catálogo con préstamos, "Mis préstamos" y perfil para el rol `usuario`. React 19 + React Router 7 + Vite 8 + Tailwind CSS 4 + Zod (validación del perfil).

- **Arranque:** `npm run dev` → http://localhost:5173 (`VITE_PORT` en `.env.local`; `vite.config.js` lo lee con `loadEnv`)
- **Librería de interfaz:** `bibliotk-ui` **de npm** (`^0.1.0`, publicada desde el repo `UiBiblioTK`). Esa versión no trae `Select`, `Footer` ni `ErrorBoundary`: usar solo lo que exporta npm. Lo que falte vive en `src/app/components/` hasta que se publique en la librería.
- **Acceso:** solo rol `usuario`. `App.jsx` consulta `GET /Sesion`; sin sesión o con otro rol redirige a la landing con `?motivo=sesion_expirada|sin_permiso`; al borrar la cuenta, `?motivo=cuenta_eliminada`. La URL se arma con `new URL(ruta, VITE_LOGIN_APP_URL)` porque esa variable puede venir con `/` final.

## Estructura

```
src/
  app/
    pages/
      App.jsx        # Rutas, guarda de rol, PanelLayout (Inicio, Catálogo, Préstamos, Mi perfil)
      Home.jsx        # /HomeUser — Libros (→ catálogo), Mi perfil (un solo botón), Préstamos, Reportes (próximamente)
      Catalogo.jsx    # /catalogo — portadas, búsqueda, filtros y "Pedir préstamo"
      Prestamos.jsx   # /prestamos — Mis préstamos: en curso e historial
      Profile.jsx     # /perfil — "Editar mis datos" + "Eliminar mi cuenta"
    components/CoverImage.jsx  # Portada con respaldo (ver abajo). Copia igual en front-admin y front
    dto/updateProfile.dto.js
    utils/userValidation.js    # Esquema Zod del perfil (sin contraseña)
    styles/globals.css         # Tema + ajustes de la cabecera de PanelLayout (ancho completo, barra deslizable)
  service/
    LoginService.js       # getCurrentSession, logoutUser → :3001
    ProfileService.js     # getProfile, updateProfile, deleteAccount → :3002 (PerfilBiblioTK)
    MaterialesService.js  # listMateriales → :3003 (MaterialesBiblioTK, lectura pública)
    PrestamosService.js   # createPrestamo, listMisPrestamos → :3005 (PrestamosBiblioTK)
```

Variables opcionales (`.env.local`): `VITE_PORT`, `VITE_LOGIN_APP_URL`, `VITE_SESSION_URL`, `VITE_LOGOUT_URL`, `VITE_PROFILE_URL`, `VITE_MATERIALES_URL`, `VITE_PRESTAMOS_URL`. Sin ellas se usan los valores por defecto de cada servicio.

## Préstamos

- **Catálogo:** al confirmar "Pedir préstamo" se llama a `POST /Prestamos`; el diálogo pasa a "¡Préstamo registrado!" con el mensaje **"Recoge el libro físico en el Poli, baños P40, sexto piso."** (el lugar lo manda el backend en `recogida`) y la fecha límite. Si el backend rechaza (vencidos, máximo de 3, ya prestado) el mensaje sale en el mismo diálogo.
- **Mis préstamos:** lee `GET /Prestamos/mios`; las portadas salen del catálogo (`listMateriales`) por `materialId`.

## Perfil

El inicio tiene **un solo botón, "Editar perfil"**; dentro de `/perfil` están las dos opciones: el formulario "Editar mis datos" y la sección "Eliminar mi cuenta" (pide la contraseña; el backend bloquea si hay préstamos sin devolver).

## Portadas (`CoverImage.jsx`)

Cada material puede traer `imagenUrl` (Cloudinary u otra URL) e `imagenLocal` (archivo servido por MaterialesBiblioTK). Se intenta primero la remota —si es una subida propia a Cloudinary se pide optimizada con `f_auto,q_auto`— y, si falla, la local; sin ninguna, una portada de color con el título.

## Pendientes conocidos

- `CoverImage` y los ajustes de la cabecera deberían pasar a `UiBiblioTK` y publicarse en npm; mientras tanto hay copias en cada front.
- `@phosphor-icons/react` y `react-router-dom` se usan directo pero llegan como dependencias de `bibliotk-ui`: conviene declararlas en `package.json`.
- La cabecera muestra el correo del JWT: tras cambiarlo en `/perfil` sigue mostrando el anterior hasta volver a iniciar sesión.
- `README.md` sigue siendo la plantilla por defecto de Vite.
