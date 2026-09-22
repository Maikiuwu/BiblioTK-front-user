const usersDashboardUrl =
	import.meta.env.VITE_USERS_DASHBOARD_URL ??
	"http://localhost:3002/DashboardBibliotk/Udashboard";

export async function getUserRoleStats() {
	const response = await fetch(usersDashboardUrl, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("No se pudieron obtener las estadísticas de usuarios.");
	}

	return await response.json();
}
