import {
	ArrowsLeftRight,
	ArrowUpRight,
	Barricade,
	Books,
	ChartLineUp,
	Clock,
	PencilSimple,
	Trash,
	UserCircle,
	UsersThree,
} from "@phosphor-icons/react";
import {
	Alert,
	Button,
	buttonClasses,
	cn,
	Dialog,
	formatNumber,
	formatToday,
	PasswordField,
} from "bibliotk-ui";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAccount, getProfile } from "../../service/ProfileService.js";
import { getUserRoleStats } from "../../service/UserService.js";

const sandSurface = "bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

// Secciones pendientes de cada perfil; el primer cuadro y el de perfil se arman aparte
const upcomingSections = {
	admin: [
		{
			title: "Libros",
			description: "Administra el catálogo de libros disponibles.",
			icon: Books,
			surface: "bg-honey-200",
		},
		{
			title: "Préstamos",
			description: "Supervisa los préstamos activos y su historial.",
			icon: ArrowsLeftRight,
			surface: sandSurface,
		},
		{
			title: "Reportes",
			description: "Genera reportes de actividad de la biblioteca.",
			icon: ChartLineUp,
			surface: "bg-pine-100",
			wide: true,
		},
	],
	reader: [
		{
			title: "Préstamos",
			description: "Consulta tus préstamos activos y su historial.",
			icon: ArrowsLeftRight,
			surface: sandSurface,
		},
		{
			title: "Reportes",
			description: "Revisa un resumen de tu actividad en la biblioteca.",
			icon: ChartLineUp,
			surface: "bg-pine-100",
			wide: true,
		},
	],
};

function FeatureTile({ to, icon: Icon, eyebrow, title, description }) {
	return (
		<Link
			to={to}
			className="grain group relative isolate flex min-h-80 flex-col justify-between overflow-hidden rounded-[28px] bg-pine-900 p-7 text-sand-50 transition-transform duration-200 ease-out-strong active:scale-[0.99] motion-safe:animate-rise md:col-span-2 md:row-span-2 md:min-h-[27rem] md:p-10 [animation-delay:80ms]"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-24 -bottom-28 size-[22rem] rounded-full border border-honey-400/30 shadow-[0_0_0_40px_rgb(217_165_90/0.05)] md:size-[30rem]"
			/>
			<div className="relative flex items-start justify-between gap-6">
				<span className="grid size-12 place-items-center rounded-2xl bg-sand-50/10 text-honey-300">
					<Icon aria-hidden="true" className="size-6" />
				</span>
				<span className="grid size-12 place-items-center rounded-full bg-honey-400 text-pine-950 transition-transform duration-200 ease-out-strong group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
					<ArrowUpRight aria-hidden="true" className="size-5" />
				</span>
			</div>
			<div className="relative mt-16">
				{eyebrow}
				<h2 className="mt-2 font-display text-[clamp(3rem,7vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.05em]">
					{title}
				</h2>
				<p className="mt-4 max-w-md text-[15px] leading-relaxed text-pine-200">
					{description}
				</p>
			</div>
		</Link>
	);
}

function UsersTile() {
	const [totalUsers, setTotalUsers] = useState(null);
	const [status, setStatus] = useState("loading");

	useEffect(() => {
		let isMounted = true;

		getUserRoleStats()
			.then((data) => {
				if (!isMounted) return;
				const roles = data?.roles ?? {};
				const total = Object.values(roles).reduce(
					(sum, value) => sum + Number(value ?? 0),
					0,
				);
				setTotalUsers(total);
				setStatus("ready");
			})
			.catch(() => {
				if (!isMounted) return;
				setStatus("error");
			});

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<FeatureTile
			to="/admin/usuarios"
			icon={UsersThree}
			title="Usuarios"
			description="Consulta la información de todos los usuarios registrados en la biblioteca."
			eyebrow={
				<>
					{status === "loading" && (
						<span className="block h-4 w-40 animate-pulse rounded-full bg-sand-50/15" />
					)}
					{status === "ready" && (
						<p className="text-sm font-medium text-pine-200">
							{formatNumber(totalUsers)}{" "}
							{totalUsers === 1 ? "usuario registrado" : "usuarios registrados"}
						</p>
					)}
				</>
			}
		/>
	);
}

function BooksTile() {
	return (
		<FeatureTile
			to="/construccion"
			icon={Books}
			title="Libros"
			description="Explora el catálogo de la biblioteca y encuentra tu próxima lectura."
			eyebrow={
				<span className="inline-flex items-center gap-1.5 rounded-full bg-honey-400/15 px-3 py-1 text-xs font-semibold text-honey-300">
					<Barricade aria-hidden="true" className="size-3.5" />
					En construcción
				</span>
			}
		/>
	);
}

function DeleteAccountDialog({ open, onClose, onDeleted }) {
	const [password, setPassword] = useState("");
	const [fieldError, setFieldError] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleClose() {
		setPassword("");
		setFieldError("");
		setError("");
		onClose();
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setFieldError("");
		setError("");
		setIsSubmitting(true);

		try {
			await deleteAccount(password);
			await onDeleted();
		} catch (deleteError) {
			if (deleteError.field === "contrasena") {
				setFieldError(deleteError.message);
			} else {
				setError(deleteError.message);
			}
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			dismissible={!isSubmitting}
			tone="danger"
			icon={<Trash aria-hidden="true" className="size-6" />}
			title="¿Borrar tu cuenta?"
			description="Se eliminarán tu cuenta y tus datos personales de BiblioTK. Esta acción no se puede deshacer."
		>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<PasswordField
					id="confirmar-contrasena"
					label="Escribe tu contraseña para confirmar"
					autoComplete="current-password"
					required
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
						setFieldError("");
					}}
					error={fieldError || undefined}
				/>
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					<Button type="submit" variant="danger" loading={isSubmitting}>
						{isSubmitting ? "Borrando..." : "Borrar cuenta"}
					</Button>
				</div>
			</form>
		</Dialog>
	);
}

function ProfileTile({ canDelete, onAccountDeleted }) {
	const titleId = useId();
	const [profile, setProfile] = useState(null);
	const [status, setStatus] = useState("loading");
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	useEffect(() => {
		let isMounted = true;

		getProfile()
			.then((data) => {
				if (!isMounted) return;
				setProfile(data);
				setStatus("ready");
			})
			.catch(() => {
				if (!isMounted) return;
				setStatus("error");
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const initials = profile
		? `${profile.nombres?.[0] ?? ""}${profile.apellidos?.[0] ?? ""}`.toUpperCase()
		: "";

	return (
		<article
			aria-labelledby={titleId}
			className="flex min-h-52 flex-col justify-between gap-8 rounded-[28px] bg-honey-200 p-7 motion-safe:animate-rise [animation-delay:140ms]"
		>
			<div className="flex items-start justify-between gap-4">
				<span
					aria-hidden="true"
					className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pine-900 font-display text-sm font-extrabold tracking-[-0.02em] text-honey-300"
				>
					{initials || <UserCircle className="size-5.5" />}
				</span>
				<div className="flex flex-wrap justify-end gap-2">
					<Link
						to="/perfil"
						aria-label="Editar mi perfil"
						className={buttonClasses({ size: "sm" })}
					>
						<PencilSimple aria-hidden="true" className="size-4" />
						Editar
					</Link>
					{canDelete && (
						<Button
							variant="outline"
							size="sm"
							aria-label="Borrar mi cuenta"
							onClick={() => setIsDeleteOpen(true)}
						>
							<Trash aria-hidden="true" className="size-4" />
							Borrar
						</Button>
					)}
				</div>
			</div>
			<div>
				<h2
					id={titleId}
					className="font-display text-3xl font-extrabold tracking-[-0.035em] text-pine-950"
				>
					Mi perfil
				</h2>
				{status === "loading" && (
					<div aria-hidden="true" className="mt-3 grid gap-2">
						<span className="block h-3.5 w-36 animate-pulse rounded-full bg-pine-950/10" />
						<span className="block h-3.5 w-44 animate-pulse rounded-full bg-pine-950/10" />
					</div>
				)}
				{status === "ready" && (
					<p className="mt-2 text-sm leading-relaxed text-ink-soft">
						<span className="block truncate font-semibold text-pine-900">
							{profile.nombres} {profile.apellidos}
						</span>
						<span className="block truncate">{profile.email}</span>
					</p>
				)}
				{status === "error" && (
					<p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
						No pudimos cargar tus datos en este momento.
					</p>
				)}
			</div>
			{canDelete && (
				<DeleteAccountDialog
					open={isDeleteOpen}
					onClose={() => setIsDeleteOpen(false)}
					onDeleted={onAccountDeleted}
				/>
			)}
		</article>
	);
}

function UpcomingTile({
	title,
	description,
	icon: Icon,
	surface,
	wide,
	delay,
}) {
	return (
		<article
			aria-label={`${title}, próximamente`}
			className={cn(
				"flex min-h-52 flex-col justify-between rounded-[28px] p-7 motion-safe:animate-rise",
				surface,
				wide && "md:col-span-3 md:min-h-40 md:flex-row md:items-end",
			)}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div
				className={cn(
					"flex items-start justify-between gap-4",
					wide && "md:flex-1 md:flex-col md:justify-end",
				)}
			>
				<span className="grid size-11 place-items-center rounded-2xl bg-pine-950/10 text-pine-900">
					<Icon aria-hidden="true" className="size-[22px]" />
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft",
						wide && "md:hidden",
					)}
				>
					<Clock aria-hidden="true" className="size-3.5" />
					Próximamente
				</span>
			</div>
			<div className={cn("mt-10", wide && "md:mt-0 md:flex-1")}>
				<h2 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-pine-950">
					{title}
				</h2>
				<p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
					{description}
				</p>
			</div>
			{wide && (
				<span className="hidden items-center gap-1.5 text-xs font-semibold text-ink-soft md:inline-flex">
					<Clock aria-hidden="true" className="size-3.5" />
					Próximamente
				</span>
			)}
		</article>
	);
}

function Home({ role, onAccountDeleted }) {
	const isAdmin = role === "admin";
	const sections = isAdmin ? upcomingSections.admin : upcomingSections.reader;
	// En el perfil lector el cuadro de perfil ocupa el primer hueco pequeño
	const firstDelay = isAdmin ? 140 : 200;

	return (
		<>
			<header className="motion-safe:animate-rise">
				<p className="text-sm font-medium text-ink-soft">{formatToday()}</p>
				<h1 className="mt-3 max-w-3xl font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
					{isAdmin ? "Panel de administración" : "Mi biblioteca"}
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
					{isAdmin
						? "Selecciona una sección para comenzar a gestionar la biblioteca."
						: "Explora la biblioteca y mantén tus datos al día desde aquí."}
				</p>
			</header>

			<section
				aria-label="Secciones de la biblioteca"
				className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3"
			>
				{isAdmin ? <UsersTile /> : <BooksTile />}
				{!isAdmin && (
					<ProfileTile
						canDelete={role === "usuario"}
						onAccountDeleted={onAccountDeleted}
					/>
				)}
				{sections.map((section, index) => (
					<UpcomingTile
						key={section.title}
						{...section}
						delay={firstDelay + index * 60}
					/>
				))}
			</section>
		</>
	);
}

export default Home;	