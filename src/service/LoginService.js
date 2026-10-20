const sessionUrl =
	import.meta.env.VITE_SESSION_URL ?? "http://localhost:3001/BiblioTK/Sesion";
const logoutUrl =
	import.meta.env.VITE_LOGOUT_URL ?? "http://localhost:3001/BiblioTK/Logout";

export async function getCurrentSession() {
	// Sin caché: al volver con "atrás", el navegador devolvía la respuesta de una sesión ya cerrada
	const response = await fetch(sessionUrl, {
		credentials: "include",
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Sesión no válida o expirada.");
	}

	return await response.json();
}

// La sesión no trae el rol: el servidor dice a qué app va la cuenta (destino) y basta con comparar orígenes
export function esSesionDeEstaApp(session) {
	try {
		return new URL(session?.destino).origin === window.location.origin;
	} catch {
		return false;
	}
}

export async function logoutUser() {
	const response = await fetch(logoutUrl, {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("No se pudo cerrar la sesión.");
	}
}
