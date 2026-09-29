const materialesUrl =
	import.meta.env.VITE_MATERIALES_URL ??
	"http://localhost:3003/MaterialesBiblioTK/Materiales";

// Lectura pública: MaterialesBiblioTK no exige sesión para GET /Materiales
export async function listMateriales() {
	let response;

	try {
		response = await fetch(materialesUrl, { cache: "no-store" });
	} catch {
		throw new Error("No se pudo conectar con el servicio de materiales.");
	}

	if (!response.ok) {
		throw new Error("No se pudo obtener el catálogo.");
	}

	const data = await response.json().catch(() => ({}));
	return data.materiales ?? [];
}
