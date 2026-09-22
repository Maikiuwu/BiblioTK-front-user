import { useEffect, useState } from "react";
import { PanelLayout } from "bibliotk-ui";
import {
	Navigate,
	Outlet,
	Route,
	Routes,
} from "react-router-dom";

import { getCurrentSession, logoutUser } from "../../service/LoginService.js";

import Home from "./Home.jsx";
import Profile from "./Profile.jsx";

function getSessionUser(session) {
	return session?.user ?? session ?? null;
}

function getSessionRole(user) {
	return String(user?.rol ?? user?.role ?? "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "");
}

function ProtectedApp() {
	const [user, setUser] = useState(null);
	const [status, setStatus] = useState("loading");

	useEffect(() => {
		let isActive = true;

		getCurrentSession()
			.then((session) => {
				if (!isActive) return;
				const currentUser = getSessionUser(session);
				setUser(currentUser);
				setStatus(
					getSessionRole(currentUser) === "usuario" ? "ready" : "forbidden",
				);
			})
			.catch(() => {
				if (isActive) setStatus("unauthenticated");
			});

		return () => {
			isActive = false;
		};
	}, []);

	if (status === "loading") return null;
	if (status !== "ready") return <Navigate to="/" replace />;

	async function handleLogout() {
		try {
			await logoutUser();
		} finally {
			const loginUrl = import.meta.env.VITE_LOGIN_APP_URL;
			window.location.assign(loginUrl || "/");
		}
	}

	async function handleAccountDeleted() {
		await logoutUser().catch(() => undefined);
		const loginUrl = import.meta.env.VITE_LOGIN_APP_URL;
		window.location.assign(loginUrl || "/");
	}

	return (
		<Routes>
			<Route
				element={
					<PanelLayout
						navItems={[
							{ to: "/HomeUser", label: "Inicio", end: true },
							{ to: "/perfil", label: "Mi perfil" },
						]}
						homePath="/HomeUser"
						userLabel={user?.email ?? user?.correo}
						onLogout={handleLogout}
					>
						<Outlet />
					</PanelLayout>
				}
			>
				<Route
					path="/HomeUser"
					element={<Home role="usuario" onAccountDeleted={handleAccountDeleted} />}
				/>
				<Route path="/perfil" element={<Profile />} />
			</Route>
			<Route path="*" element={<Navigate to="/HomeUser" replace />} />
		</Routes>
	);
}

function App() {
	return <ProtectedApp />;
}

export default App;
