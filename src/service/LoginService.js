const sessionUrl =
	import.meta.env.VITE_SESSION_URL ?? "http://localhost:3001/BiblioTK/Sesion";
const logoutUrl =
	import.meta.env.VITE_LOGOUT_URL ?? "http://localhost:3001/BiblioTK/Logout";

export async function getCurrentSession() {
	const response = await fetch(sessionUrl, {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Sesión no válida o expirada.");
	}

	return await response.json();
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
