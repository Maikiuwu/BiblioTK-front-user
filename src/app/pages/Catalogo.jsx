import {
	ArrowsClockwise,
	Books,
	CalendarCheck,
	CheckCircle,
	MapPin,
} from "@phosphor-icons/react";
import {
	Alert,
	Button,
	buttonClasses,
	Checkbox,
	cn,
	Dialog,
	formatDate,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMateriales } from "../../service/MaterialesService.js";
import { createPrestamo } from "../../service/PrestamosService.js";
import CoverImage from "../components/CoverImage.jsx";

const cardClasses =
	"rounded-[28px] bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const tipoLabels = {
	LIBRO: "Libro",
	REVISTA: "Revista",
	NOVELA: "Novela",
};

const filtrosTipo = [
	{ valor: "", etiqueta: "Todo" },
	{ valor: "LIBRO", etiqueta: "Libros" },
	{ valor: "REVISTA", etiqueta: "Revistas" },
	{ valor: "NOVELA", etiqueta: "Novelas" },
];

// Minúsculas y sin tildes: "garcia" encuentra "García"
function normalizar(texto) {
	return String(texto ?? "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

function coincide(material, busqueda) {
	if (!busqueda) return true;

	return [material.titulo, material.autor, material.editorial, material.isbn].some(
		(campo) => normalizar(campo).includes(busqueda),
	);
}

function MaterialResumen({ material, children }) {
	return (
		<div className="flex gap-4 rounded-2xl bg-sand-100 p-3">
			<div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-sand-200">
				<CoverImage material={material} ancho={160} compacta />
			</div>
			<div className="min-w-0 self-center">
				<p className="font-semibold leading-snug text-pine-950">
					{material.titulo}
				</p>
				<p className="mt-0.5 text-sm text-ink-soft">{material.autor}</p>
				{children}
			</div>
		</div>
	);
}

function LoanDialog({ material, onClose, onPrestado, onNoDisponible }) {
	const [estado, setEstado] = useState("confirmar");
	const [resultado, setResultado] = useState(null);
	const [error, setError] = useState("");
	const enviando = estado === "enviando";

	async function handleConfirm() {
		setEstado("enviando");
		setError("");

		try {
			const data = await createPrestamo(material.id);
			setResultado(data);
			setEstado("listo");
			onPrestado(material.id);
		} catch (requestError) {
			setError(requestError.message);
			setEstado("confirmar");

			// Otra persona se lo llevó mientras tanto: la tarjeta deja de ofrecerlo
			if (requestError.field === "materialId") onNoDisponible(material.id);
		}
	}

	if (estado === "listo") {
		return (
			<Dialog
				open
				onClose={onClose}
				icon={<CheckCircle aria-hidden="true" className="size-6" />}
				title="¡Préstamo registrado!"
				description={`«${material.titulo}» quedó apartado a tu nombre.`}
			>
				<div className="grid gap-5">
					<div className="flex items-start gap-3 rounded-2xl bg-honey-100 p-4 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)]">
						<MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
						<p className="text-[15px] font-semibold leading-snug">
							Recoge el libro físico en {resultado.recogida}.
						</p>
					</div>
					<MaterialResumen material={material}>
						{resultado.prestamo?.fechaDevolucionEsperada && (
							<p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-pine-800">
								<CalendarCheck aria-hidden="true" className="size-4 shrink-0" />
								Devuélvelo antes del{" "}
								{formatDate(resultado.prestamo.fechaDevolucionEsperada)}
							</p>
						)}
					</MaterialResumen>
					<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<Button variant="outline" onClick={onClose}>
							Seguir explorando
						</Button>
						<Link to="/prestamos" className={buttonClasses()}>
							Ver mis préstamos
						</Link>
					</div>
				</div>
			</Dialog>
		);
	}

	return (
		<Dialog
			open
			onClose={onClose}
			dismissible={!enviando}
			title="¿Pedir este préstamo?"
			description="Al confirmar, el material queda apartado a tu nombre y te decimos dónde recogerlo."
		>
			<div className="grid gap-5">
				<MaterialResumen material={material} />
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={onClose} disabled={enviando}>
						Cancelar
					</Button>
					<Button loading={enviando} onClick={handleConfirm}>
						{enviando ? "Registrando..." : "Confirmar préstamo"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function MaterialCard({ material, delay, onPedir }) {
	const disponible = Boolean(material.disponible);
	const detalle = [material.editorial, material.anioPublicacion]
		.filter(Boolean)
		.join(" · ");

	return (
		<article
			className={cn(
				cardClasses,
				"flex flex-col overflow-hidden motion-safe:animate-rise",
			)}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="relative aspect-[3/4] overflow-hidden bg-sand-200">
				<CoverImage material={material} />
				<span className="absolute top-3 left-3 rounded-full bg-sand-50/90 px-2.5 py-1 text-xs font-semibold text-pine-900 shadow-[0_4px_12px_-6px_rgb(11_34_28/0.45)]">
					{tipoLabels[material.tipoMaterial] ?? material.tipoMaterial}
				</span>
			</div>
			<div className="flex flex-1 flex-col p-5">
				<h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-pine-950">
					{material.titulo}
				</h2>
				<p className="mt-1 text-sm text-ink-soft">{material.autor}</p>
				{detalle && <p className="mt-1 text-xs text-ink-faint">{detalle}</p>}
				<div className="mt-auto pt-5">
					<p
						className={cn(
							"flex items-center gap-2 text-[13px] font-semibold",
							disponible ? "text-pine-700" : "text-ink-soft",
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								"size-2 rounded-full",
								disponible ? "bg-pine-500" : "bg-sand-400",
							)}
						/>
						{disponible ? "Disponible" : "No disponible por ahora"}
					</p>
					<Button
						size="sm"
						variant={disponible ? "primary" : "outline"}
						className="mt-3 w-full"
						disabled={!disponible}
						onClick={() => onPedir(material)}
					>
						Pedir préstamo
					</Button>
				</div>
			</div>
		</article>
	);
}

function TipoChips({ value, onChange }) {
	return (
		<fieldset className="flex flex-wrap gap-2">
			<legend className="sr-only">Tipo de material</legend>
			{filtrosTipo.map((filtro) => (
				<button
					key={filtro.valor || "todo"}
					type="button"
					aria-pressed={value === filtro.valor}
					onClick={() => onChange(filtro.valor)}
					className={cn(
						"h-10 rounded-full px-4 text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.97]",
						value === filtro.valor
							? "bg-pine-900 text-sand-50"
							: "bg-sand-100 text-pine-900 shadow-[inset_0_0_0_1px_var(--color-sand-300)] hover:bg-sand-200",
					)}
				>
					{filtro.etiqueta}
				</button>
			))}
		</fieldset>
	);
}

function Catalogo() {
	const [materiales, setMateriales] = useState([]);
	const [status, setStatus] = useState("loading");
	const [error, setError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [tipo, setTipo] = useState("");
	const [soloDisponibles, setSoloDisponibles] = useState(false);
	const [seleccionado, setSeleccionado] = useState(null);

	// Solo actualiza el estado al responder: el "cargando" inicial ya viene del useState
	const cargarMateriales = useCallback(() => {
		listMateriales()
			.then((data) => {
				setMateriales(data);
				setStatus("ready");
			})
			.catch((loadError) => {
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		cargarMateriales();
	}, [cargarMateriales]);

	function reintentar() {
		setStatus("loading");
		setError("");
		cargarMateriales();
	}

	function marcarNoDisponible(materialId) {
		setMateriales((actuales) =>
			actuales.map((material) =>
				material.id === materialId ? { ...material, disponible: 0 } : material,
			),
		);
	}

	function limpiarFiltros() {
		setBusqueda("");
		setTipo("");
		setSoloDisponibles(false);
	}

	const textoBuscado = normalizar(busqueda.trim());
	const visibles = materiales.filter(
		(material) =>
			(!tipo || material.tipoMaterial === tipo) &&
			(!soloDisponibles || material.disponible) &&
			coincide(material, textoBuscado),
	);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-rise">
				<div>
					<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
						Catálogo
					</h1>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
						Elige un libro, revista o novela y pide tu préstamo. Al confirmarlo
						te decimos dónde recoger el ejemplar físico.
					</p>
				</div>
				<Link to="/prestamos" className={buttonClasses({ variant: "outline" })}>
					Mis préstamos
				</Link>
			</header>

			{status === "loading" && (
				<div
					aria-busy="true"
					className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
				>
					{[0, 1, 2, 3].map((key) => (
						<span
							key={key}
							className="block aspect-[3/5] animate-pulse rounded-[28px] bg-sand-200/70"
						/>
					))}
					<p className="sr-only">Cargando el catálogo</p>
				</div>
			)}

			{status === "error" && (
				<div className={cn(cardClasses, "mt-10 p-6 md:p-10")}>
					<Alert tone="error">{error}</Alert>
					<Button className="mt-6" onClick={reintentar}>
						<ArrowsClockwise aria-hidden="true" className="size-[18px]" />
						Reintentar
					</Button>
				</div>
			)}

			{status === "ready" && materiales.length === 0 && (
				<div
					className={cn(
						cardClasses,
						"mt-10 grid place-items-center gap-3 px-6 py-16 text-center",
					)}
				>
					<span className="grid size-12 place-items-center rounded-2xl bg-pine-900 text-honey-300">
						<Books aria-hidden="true" className="size-6" />
					</span>
					<strong className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950">
						Todavía no hay material en el catálogo
					</strong>
					<p className="max-w-xs text-sm text-ink-soft">
						Vuelve pronto: el bibliotecario está cargando libros, revistas y
						novelas.
					</p>
				</div>
			)}

			{status === "ready" && materiales.length > 0 && (
				<>
					<section
						aria-label="Filtros del catálogo"
						className={cn(
							cardClasses,
							"mt-10 grid gap-4 p-5 motion-safe:animate-rise [animation-delay:60ms] md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-6",
						)}
					>
						<TextField
							id="buscar-material"
							label="Buscar"
							type="search"
							placeholder="Título, autor, editorial o ISBN"
							autoComplete="off"
							value={busqueda}
							onChange={(event) => setBusqueda(event.target.value)}
						/>
						<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
							<TipoChips value={tipo} onChange={setTipo} />
							<Checkbox
								id="solo-disponibles"
								label="Solo disponibles"
								checked={soloDisponibles}
								onChange={(event) => setSoloDisponibles(event.target.checked)}
							/>
						</div>
					</section>

					<p aria-live="polite" className="mt-6 text-sm text-ink-soft">
						{visibles.length === 1
							? "1 material"
							: `${visibles.length} materiales`}
					</p>

					{visibles.length === 0 ? (
						<div
							className={cn(
								cardClasses,
								"mt-3 grid place-items-center gap-3 px-6 py-14 text-center",
							)}
						>
							<strong className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950">
								No encontramos material con esos filtros
							</strong>
							<Button variant="outline" size="sm" onClick={limpiarFiltros}>
								Limpiar filtros
							</Button>
						</div>
					) : (
						<section
							aria-label="Material bibliográfico"
							className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
						>
							{visibles.map((material, index) => (
								<MaterialCard
									key={material.id}
									material={material}
									delay={80 + Math.min(index, 8) * 40}
									onPedir={setSeleccionado}
								/>
							))}
						</section>
					)}
				</>
			)}

			{seleccionado && (
				<LoanDialog
					key={seleccionado.id}
					material={seleccionado}
					onClose={() => setSeleccionado(null)}
					onPrestado={marcarNoDisponible}
					onNoDisponible={marcarNoDisponible}
				/>
			)}
		</>
	);
}

export default Catalogo;
