const prestamosUrl =
	import.meta.env.VITE_PRESTAMOS_URL ??
	"http://localhost:3005/PrestamosBiblioTK";

async function requestPrestamos(path, options, fallbackMessage) {
	let response;

	try {
		response = await fetch(`${prestamosUrl}${path}`, {
			credentials: "include",
			cache: "no-store",
			...options,
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de préstamos.");
	}

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(
			response.status === 401
				? "Tu sesión terminó. Inicia sesión de nuevo para continuar."
				: (data.message ?? fallbackMessage),
		);
		error.status = response.status;
		// Nombre del campo con problema, cuando el backend lo indica
		error.field = data.campo;
		throw error;
	}

	return data;
}

// Devuelve { prestamo, recogida }: recogida es el lugar donde se retira el libro físico
export async function createPrestamo(materialId) {
	return requestPrestamos(
		"/Prestamos",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ materialId }),
		},
		"No se pudo registrar el préstamo.",
	);
}

// Devuelve { prestamos, recogida, maximo }
export async function listMisPrestamos() {
	return requestPrestamos(
		"/Prestamos/mios",
		{},
		"No se pudieron obtener tus préstamos.",
	);
}

// Solo préstamos ACTIVO del propio lector; devuelve el préstamo ya cancelado
export async function cancelMiPrestamo(prestamoId) {
	const data = await requestPrestamos(
		`/Prestamos/mios/${prestamoId}/cancelacion`,
		{ method: "PUT" },
		"No se pudo cancelar el préstamo.",
	);
	return data.prestamo;
}
