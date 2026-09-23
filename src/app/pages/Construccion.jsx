import { ArrowLeft } from "@phosphor-icons/react";
import { buttonClasses } from "bibliotk-ui";
import { Link } from "react-router-dom";

function Construccion() {
	return (
		<section className="grain relative isolate overflow-hidden rounded-[32px] bg-pine-900 px-7 py-16 text-sand-50 md:px-16 md:py-28">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-40 -right-32 size-[26rem] rounded-full border border-honey-400/35 shadow-[0_0_0_48px_rgb(217_165_90/0.06),0_0_0_96px_rgb(217_165_90/0.04)] md:size-[40rem]"
			/>
			<div className="relative max-w-3xl">
				<p className="text-sm font-semibold text-honey-300 motion-safe:animate-rise">
					Libros
				</p>
				<h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.05em] motion-safe:animate-rise [animation-delay:60ms]">
					Tu espacio de lectura está en construcción.
				</h1>
				<p className="mt-6 max-w-lg text-base leading-relaxed text-pine-200 motion-safe:animate-rise [animation-delay:120ms]">
					Esta sección todavía no está disponible. Pronto podrás consultar el
					catálogo y seguir tus préstamos desde aquí.
				</p>
				<Link
					to="/HomeUser"
					className={buttonClasses({
						variant: "accent",
						className: "mt-10 motion-safe:animate-rise [animation-delay:180ms]",
					})}
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Volver al inicio
				</Link>
			</div>
		</section>
	);
}

export default Construccion;
