import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { ArrowsLeftRight } from "@phosphor-icons/react/ArrowsLeftRight";
import { HourglassMedium } from "@phosphor-icons/react/HourglassMedium";
import { MapPin } from "@phosphor-icons/react/MapPin";
import { XCircle } from "@phosphor-icons/react/XCircle";
import {
	Alert,
	Button,
	buttonClasses,
	cn,
	CoverImage,
	Dialog,
	formatDate,
} from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMateriales } from "../../service/MaterialesService.js";
import {
	cancelMiPrestamo,
	listMisPrestamos,
} from "../../service/PrestamosService.js";

const cardClasses =
	"rounded-[28px] bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const estados = {
	SOLICITADO: {
		etiqueta: "Esperando aprobación",
		clase: "bg-honey-100 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)]",
	},
	ACTIVO: { etiqueta: "Aprobado", clase: "bg-pine-100 text-pine-800" },
	VENCIDO: {
		etiqueta: "Vencido",
		clase: "bg-clay-50 text-clay-700 shadow-[inset_0_0_0_1px_rgb(163_64_47/0.18)]",
	},
	DEVUELTO: { etiqueta: "Devuelto", clase: "bg-sand-200 text-ink-soft" },
	CANCELADO: {
		etiqueta: "Cancelado",
		clase: "bg-sand-200 text-ink-soft shadow-[inset_0_0_0_1px_var(--color-sand-300)]",
	},
	RECHAZADO: { etiqueta: "Rechazado", clase: "bg-clay-50 text-clay-700" },
};

const cerrados = ["DEVUELTO", "CANCELADO", "RECHAZADO"];
// Solo se recoge (y se devuelve) lo que el bibliotecario ya aprobó
const aprobados = ["ACTIVO", "VENCIDO"];

// Nunca se aprobó (sigue esperando, se rechazó o se canceló antes de aprobarse): su fecha es
// la de la solicitud, no la de un préstamo
function fueSolicitud(prestamo) {
	return (
		prestamo.estado === "SOLICITADO" ||
		prestamo.estado === "RECHAZADO" ||
		(prestamo.estado === "CANCELADO" &&
			Boolean(prestamo.fechaSolicitud) &&
			!prestamo.fechaRespuesta)
	);
}

function Dato({ etiqueta, valor, destacado }) {
	return (
		<div>
			<dt className="text-xs text-ink-faint">{etiqueta}</dt>
			<dd
				className={cn(
					"mt-0.5 text-[13px] font-semibold",
					destacado ? "text-clay-700" : "text-pine-900",
				)}
			>
				{valor}
			</dd>
		</div>
	);
}

function CancelarDialog({ prestamo, recogida, onClose, onCancelado }) {
	const solicitud = prestamo.estado === "SOLICITADO";
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleConfirm() {
		setError("");
		setIsSubmitting(true);

		try {
			onCancelado(await cancelMiPrestamo(prestamo.prestamoId));
		} catch (cancelError) {
			setError(cancelError.message);
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open
			onClose={onClose}
			dismissible={!isSubmitting}
			tone="danger"
			icon={<XCircle aria-hidden="true" className="size-6" />}
			title={solicitud ? "¿Cancelar esta solicitud?" : "¿Cancelar este préstamo?"}
			description={`«${prestamo.materialTitulo}» vuelve a quedar disponible para otros lectores.`}
		>
			<div className="grid gap-5">
				{!solicitud && (
					<p className="text-sm leading-relaxed text-ink-soft">
						Cancela solo si todavía no recogiste el libro. Si ya lo tienes,
						devuélvelo en {recogida}.
					</p>
				)}
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Volver
					</Button>
					<Button variant="danger" loading={isSubmitting} onClick={handleConfirm}>
						{isSubmitting
							? "Cancelando..."
							: solicitud
								? "Cancelar solicitud"
								: "Cancelar préstamo"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function DatosCierre({ prestamo }) {
	if (prestamo.estado === "DEVUELTO") {
		return (
			<Dato etiqueta="Devuelto el" valor={formatDate(prestamo.fechaDevolucionReal)} />
		);
	}

	if (prestamo.estado === "CANCELADO") {
		return (
			<Dato
				etiqueta={
					prestamo.canceladoPor === "admin"
						? "Cancelado por la biblioteca el"
						: "Lo cancelaste el"
				}
				valor={formatDate(prestamo.fechaCancelacion)}
			/>
		);
	}

	if (prestamo.estado === "RECHAZADO") {
		return <Dato etiqueta="Rechazada el" valor={formatDate(prestamo.fechaRespuesta)} />;
	}

	if (prestamo.estado === "SOLICITADO") return null;

	return (
		<Dato
			etiqueta="Devolver antes del"
			valor={formatDate(prestamo.fechaDevolucionEsperada)}
			destacado={prestamo.estado === "VENCIDO"}
		/>
	);
}

function PrestamoItem({ prestamo, material, recogida, delay, onCancelar }) {
	const estado = estados[prestamo.estado] ?? estados.ACTIVO;
	const sinAprobar = fueSolicitud(prestamo);
	const cancelable = prestamo.estado === "SOLICITADO" || prestamo.estado === "ACTIVO";

	return (
		<li
			className={cn(cardClasses, "flex gap-4 p-4 motion-safe:animate-rise sm:p-5")}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-200">
				<CoverImage
					material={material ?? { titulo: prestamo.materialTitulo }}
					ancho={200}
					compacta
				/>
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
					<div className="min-w-0">
						<h3 className="font-display text-lg leading-tight font-extrabold tracking-[-0.03em] text-pine-950">
							{prestamo.materialTitulo}
						</h3>
						<p className="mt-0.5 text-sm text-ink-soft">{prestamo.materialAutor}</p>
					</div>
					<span
						className={cn(
							"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
							estado.clase,
						)}
					>
						{estado.etiqueta}
					</span>
				</div>
				<dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap">
					<Dato
						etiqueta={sinAprobar ? "Solicitado el" : "Prestado el"}
						valor={formatDate(prestamo.fechaPrestamo)}
					/>
					<DatosCierre prestamo={prestamo} />
				</dl>
				{prestamo.estado === "SOLICITADO" && (
					<p className="mt-3 flex items-start gap-1.5 text-[13px] font-medium text-honey-700">
						<HourglassMedium aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
						Un bibliotecario debe aprobar tu solicitud. No vayas por el libro todavía:
						te avisamos cuando puedas recogerlo.
					</p>
				)}
				{prestamo.estado === "ACTIVO" && (
					<p className="mt-3 flex items-start gap-1.5 text-[13px] font-medium text-pine-800">
						<MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
						Ya puedes recogerlo en {recogida}.
					</p>
				)}
				{prestamo.estado === "RECHAZADO" && prestamo.observaciones && (
					<p className="mt-3 text-[13px] text-ink-soft">
						Motivo: {prestamo.observaciones}
					</p>
				)}
				{prestamo.estado === "VENCIDO" && (
					<p className="mt-3 text-[13px] font-medium text-clay-700">
						Este préstamo está vencido: devuélvelo cuanto antes para poder pedir
						otro.
					</p>
				)}
				{prestamo.estado === "CANCELADO" && prestamo.observaciones && (
					<p className="mt-3 text-[13px] text-ink-soft">
						Motivo: {prestamo.observaciones}
					</p>
				)}
				{cancelable && prestamo.prestamoId && (
					<Button
						variant="outline"
						size="sm"
						className="mt-4"
						aria-label={`Cancelar ${prestamo.estado === "SOLICITADO" ? "la solicitud" : "el préstamo"} de «${prestamo.materialTitulo}»`}
						onClick={() => onCancelar(prestamo)}
					>
						<XCircle aria-hidden="true" className="size-4" />
						{prestamo.estado === "SOLICITADO" ? "Cancelar solicitud" : "Cancelar préstamo"}
					</Button>
				)}
			</div>
		</li>
	);
}

function Seccion({ titulo, prestamos, portadas, recogida, delayInicial, onCancelar }) {
	return (
		<section aria-label={titulo} className="mt-10">
			<h2 className="font-display text-2xl font-extrabold tracking-[-0.035em] text-pine-950">
				{titulo}
			</h2>
			<ul className="mt-4 grid gap-3 lg:grid-cols-2">
				{prestamos.map((prestamo, index) => (
					<PrestamoItem
						key={prestamo.id}
						prestamo={prestamo}
						material={portadas.get(prestamo.materialId)}
						recogida={recogida}
						delay={delayInicial + Math.min(index, 8) * 40}
						onCancelar={onCancelar}
					/>
				))}
			</ul>
		</section>
	);
}

function Prestamos() {
	const [status, setStatus] = useState("loading");
	const [datos, setDatos] = useState({ prestamos: [], recogida: "", maximo: 0 });
	const [portadas, setPortadas] = useState(() => new Map());
	const [error, setError] = useState("");
	const [aCancelar, setACancelar] = useState(null);
	const [aviso, setAviso] = useState("");

	// Solo actualiza el estado al responder: el "cargando" inicial ya viene del useState.
	// Las portadas salen del catálogo (MaterialesBiblioTK); si no responde, se muestran vacías
	const cargar = useCallback(() => {
		Promise.all([listMisPrestamos(), listMateriales().catch(() => [])])
			.then(([misPrestamos, materiales]) => {
				setDatos(misPrestamos);
				setPortadas(new Map(materiales.map((material) => [material.id, material])));
				setStatus("ready");
			})
			.catch((loadError) => {
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		cargar();
	}, [cargar]);

	// Cuando el bibliotecario aprueba o rechaza una solicitud, el aviso llega por la campana:
	// la lista se recarga sola
	useEffect(() => {
		function alNotificar(event) {
			if (event.detail?.categoria === "prestamos") cargar();
		}

		window.addEventListener("bibliotk:notificacion", alNotificar);
		return () => window.removeEventListener("bibliotk:notificacion", alNotificar);
	}, [cargar]);

	function reintentar() {
		setStatus("loading");
		setError("");
		cargar();
	}

	function handleCancelado(actualizado) {
		const eraSolicitud = aCancelar?.estado === "SOLICITADO";
		setACancelar(null);
		setAviso(
			`Cancelaste ${eraSolicitud ? "la solicitud" : "el préstamo"} de «${actualizado.materialTitulo}».`,
		);
		setDatos((actuales) => ({
			...actuales,
			prestamos: actuales.prestamos.map((prestamo) =>
				prestamo.id === actualizado.id ? actualizado : prestamo,
			),
		}));
	}

	const enCurso = datos.prestamos.filter(
		(prestamo) => !cerrados.includes(prestamo.estado),
	);
	const historial = datos.prestamos.filter((prestamo) =>
		cerrados.includes(prestamo.estado),
	);
	const hayAprobados = enCurso.some((prestamo) => aprobados.includes(prestamo.estado));

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-rise">
				<div>
					<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
						Mis préstamos
					</h1>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
						Sigue tus solicitudes, tus préstamos aprobados y su historial.
					</p>
				</div>
				<Link to="/catalogo" className={buttonClasses({ variant: "outline" })}>
					Ir al catálogo
				</Link>
			</header>

			{status === "loading" && (
				<div aria-busy="true" className="mt-10 grid gap-3 lg:grid-cols-2">
					{[0, 1].map((key) => (
						<span
							key={key}
							className="block h-36 animate-pulse rounded-[28px] bg-sand-200/70"
						/>
					))}
					<p className="sr-only">Cargando tus préstamos</p>
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

			{status === "ready" && datos.prestamos.length === 0 && (
				<div
					className={cn(
						cardClasses,
						"mt-10 grid place-items-center gap-3 px-6 py-16 text-center motion-safe:animate-rise",
					)}
				>
					<span className="grid size-12 place-items-center rounded-2xl bg-pine-900 text-honey-300">
						<ArrowsLeftRight aria-hidden="true" className="size-6" />
					</span>
					<strong className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950">
						Todavía no has pedido préstamos
					</strong>
					<p className="max-w-xs text-sm text-ink-soft">
						Busca un libro en el catálogo y pídelo prestado en un clic.
					</p>
					<Link to="/catalogo" className={buttonClasses({ className: "mt-3" })}>
						Explorar el catálogo
					</Link>
				</div>
			)}

			{status === "ready" && datos.prestamos.length > 0 && (
				<>
					{aviso && (
						<Alert tone="success" className="mt-10">
							{aviso}
						</Alert>
					)}
					{enCurso.length > 0 && (
						<div
							className={cn(
								"flex items-start gap-3 rounded-2xl bg-honey-100 p-4 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)] motion-safe:animate-rise [animation-delay:60ms] md:items-center",
								aviso ? "mt-3" : "mt-10",
							)}
						>
							<MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 md:mt-0" />
							<p className="text-[15px] font-semibold leading-snug">
								{hayAprobados
									? `Recoge tus libros aprobados en ${datos.recogida}.`
									: "Cuando un bibliotecario apruebe tu solicitud, podrás recoger el libro."}
								{datos.maximo > 0 && (
									<span className="block text-[13px] font-medium md:inline md:before:content-['_·_']">
										Puedes tener hasta {datos.maximo} préstamos a la vez.
									</span>
								)}
							</p>
						</div>
					)}
					{enCurso.length > 0 && (
						<Seccion
							titulo="En curso"
							prestamos={enCurso}
							portadas={portadas}
							recogida={datos.recogida}
							delayInicial={100}
							onCancelar={setACancelar}
						/>
					)}
					{historial.length > 0 && (
						<Seccion
							titulo="Historial"
							prestamos={historial}
							portadas={portadas}
							recogida={datos.recogida}
							delayInicial={160}
							onCancelar={setACancelar}
						/>
					)}
				</>
			)}

			{aCancelar && (
				<CancelarDialog
					key={aCancelar.id}
					prestamo={aCancelar}
					recogida={datos.recogida}
					onClose={() => setACancelar(null)}
					onCancelado={handleCancelado}
				/>
			)}
		</>
	);
}

export default Prestamos;
