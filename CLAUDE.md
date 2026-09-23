# BiblioTK-front-user — App del rol `usuario`

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Home y perfil para el rol `usuario` (lector). React 19 + React Router 7 + Vite 8 + Tailwind CSS 4.

- **Arranque:** `npm run dev` → http://localhost:5173
- **Librería de interfaz:** `bibliotk-ui` (`file:../BiblioTK-ui`) — ver su CLAUDE.md para el sistema de diseño.
- **Acceso:** solo rol `usuario`. `App.jsx` verifica `GET /Sesion`; si no hay sesión o el rol no es `usuario`, redirige a `${LOGIN_URL}/login?motivo=...` (`sesion_expirada` o `sin_permiso`) — esta app no tiene ruta `/` propia. Borrar la cuenta redirige con `motivo=cuenta_eliminada`. Ver "Mensajes tras un redirect entre apps" en `BiblioTK-front/CLAUDE.md`.

## Estructura

```
src/
  app/
    pages/
      App.jsx          # Rutas, guarda de rol, PanelLayout
      Home.jsx          # /HomeUser — Libros, Mi perfil (sin botones, lleva a /perfil), Préstamos/Reportes
      Profile.jsx       # /perfil — editar datos + borrar cuenta
      Construccion.jsx  # /construccion — destino del cuadro Libros
    dto/updateProfile.dto.js
    utils/userValidation.js
  service/
    LoginService.js     # getCurrentSession, logoutUser → :3001
    ProfileService.js    # getProfile, updateProfile, deleteAccount → :3003
```

## Home (`Home.jsx`)

A diferencia del front viejo (donde este mismo archivo también dibujaba la vista de `admin`), acá solo existe el rol `usuario`: sin ramas por rol, sin cuadro de Usuarios.

- **Mi perfil**: la tarjeta entera es un `<Link to="/perfil">` — sin botones de Editar/Borrar encima (así se pidió explícitamente). Solo muestra iniciales, nombre y correo; el detalle y la edición viven en `/perfil`.
- **Borrar cuenta**: se movió de esta tarjeta a `Profile.jsx` (sección "Zona de peligro", al final de la página) — pide la contraseña igual que antes.

## Pendientes conocidos

- La cabecera muestra el correo del JWT: tras cambiarlo en `/perfil` sigue mostrando el anterior hasta volver a iniciar sesión (igual que en el front viejo).
- `README.md` sigue siendo la plantilla por defecto de Vite.
