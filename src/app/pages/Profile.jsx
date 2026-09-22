import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";
import {
	Alert,
	Button,
	buttonClasses,
	formatDate,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile } from "../../service/ProfileService.js";
import { createUpdateProfileDto } from "../dto/updateProfile.dto.js";
import {
	emailPattern,
	fieldLimits,
	namePattern,
	validateUserData,
} from "../utils/userValidation.js";

const cardClasses =
	"mt-10 max-w-3xl rounded-[28px] bg-sand-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sand-200)] md:p-10";

function toFormData(profile) {
	return {
		nombres: profile?.nombres ?? "",
		apellidos: profile?.apellidos ?? "",
		nombreUsuario: profile?.nombreUsuario ?? "",
		email: profile?.email ?? "",
		cc: profile?.cc == null ? "" : String(profile.cc),
		celular: profile?.celular == null ? "" : String(profile.celular),
	};
}

function Profile() {
	const [status, setStatus] = useState("loading");
	const [profile, setProfile] = useState(null);
	const [formData, setFormData] = useState(() => toFormData(null));
	const [fieldError, setFieldError] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const loadProfile = useCallback(() => {
		setStatus("loading");
		setError("");

		getProfile()
			.then((data) => {
				if (!isMountedRef.current) return;
				setProfile(data);
				setFormData(toFormData(data));
				setStatus("ready");
			})
			.catch((loadError) => {
				if (!isMountedRef.current) return;
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	const savedFormData = toFormData(profile);
	const hasChanges = Object.keys(formData).some(
		(field) => formData[field] !== savedFormData[field],
	);
	const initials =
		`${profile?.nombres?.[0] ?? ""}${profile?.apellidos?.[0] ?? ""}`.toUpperCase();
	const memberSince = profile?.fechaRegistro
		? formatDate(profile.fechaRegistro)
		: "";

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setSuccess("");

		if (fieldError?.field === name) {
			setFieldError(null);
		}
	}

	function errorFor(field) {
		return fieldError?.field === field ? fieldError.message : undefined;
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSuccess("");

		const validationError = validateUserData(formData);

		if (validationError) {
			setFieldError(validationError);
			document.getElementById(validationError.field)?.focus();
			return;
		}

		setFieldError(null);
		setIsSubmitting(true);

		try {
			const updatedProfile = await updateProfile(
				createUpdateProfileDto(formData),
			);
			const emailChanged = updatedProfile.email !== profile.email;
			setProfile(updatedProfile);
			setFormData(toFormData(updatedProfile));
			setSuccess(
				emailChanged
					? "Tus datos se guardaron. La próxima vez inicia sesión con tu nuevo correo."
					: "Tus datos se guardaron correctamente.",
			);
		} catch (saveError) {
			if (saveError.field) {
				setFieldError({ field: saveError.field, message: saveError.message });
				document.getElementById(saveError.field)?.focus();
			} else {
				setError(saveError.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<header className="motion-safe:animate-rise">
				<Link
					to="/inicio"
					className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-pine-900"
				>
					<ArrowLeft
						aria-hidden="true"
						className="size-4 transition-transform duration-200 ease-out-strong group-hover:-translate-x-0.5"
					/>
					Volver al inicio
				</Link>
				<h1 className="mt-6 font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
					Mi perfil
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
					Revisa y actualiza tus datos personales.
				</p>
			</header>

			{status === "loading" && (
				<div aria-busy="true" className={cardClasses}>
					<div className="flex items-center gap-4">
						<span className="block size-14 animate-pulse rounded-2xl bg-sand-200" />
						<div className="grid gap-2">
							<span className="block h-5 w-48 animate-pulse rounded-full bg-sand-200" />
							<span className="block h-3.5 w-36 animate-pulse rounded-full bg-sand-200" />
						</div>
					</div>
					<div className="mt-8 grid gap-5 sm:grid-cols-2">
						{Object.keys(savedFormData).map((field) => (
							<span
								key={field}
								className="block h-[4.75rem] animate-pulse rounded-xl bg-sand-200/70"
							/>
						))}
					</div>
					<p className="sr-only">Cargando tu perfil</p>
				</div>
			)}

			{status === "error" && (
				<div className={cardClasses}>
					<Alert tone="error">{error}</Alert>
					<Button className="mt-6" onClick={loadProfile}>
						<ArrowsClockwise aria-hidden="true" className="size-[18px]" />
						Reintentar
					</Button>
				</div>
			)}

			{status === "ready" && (
				<section
					aria-labelledby="perfil-nombre"
					className={`${cardClasses} motion-safe:animate-rise [animation-delay:80ms]`}
				>
					<div className="flex items-center gap-4">
						<span
							aria-hidden="true"
							className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pine-900 font-display text-lg font-extrabold tracking-[-0.02em] text-honey-300"
						>
							{initials}
						</span>
						<div className="min-w-0">
							<h2
								id="perfil-nombre"
								className="truncate font-display text-2xl font-extrabold tracking-[-0.035em] text-pine-950"
							>
								{profile.nombres} {profile.apellidos}
							</h2>
							{memberSince && (
								<p className="mt-1 text-sm text-ink-soft">
									Miembro desde el {memberSince}
								</p>
							)}
						</div>
					</div>

					<form
						onSubmit={handleSubmit}
						className="mt-8 grid gap-5 sm:grid-cols-2"
					>
						<TextField
							id="nombres"
							name="nombres"
							label="Nombres"
							type="text"
							pattern={namePattern}
							minLength={2}
							maxLength={fieldLimits.nombres}
							title="Solo se permiten letras, espacios, apóstrofes o guiones"
							autoComplete="given-name"
							required
							value={formData.nombres}
							onChange={handleChange}
							error={errorFor("nombres")}
						/>
						<TextField
							id="apellidos"
							name="apellidos"
							label="Apellidos"
							type="text"
							pattern={namePattern}
							minLength={2}
							maxLength={fieldLimits.apellidos}
							title="Solo se permiten letras, espacios, apóstrofes o guiones"
							autoComplete="family-name"
							required
							value={formData.apellidos}
							onChange={handleChange}
							error={errorFor("apellidos")}
						/>
						<TextField
							id="nombreUsuario"
							name="nombreUsuario"
							label="Nombre de usuario"
							type="text"
							maxLength={fieldLimits.nombreUsuario}
							autoComplete="username"
							required
							value={formData.nombreUsuario}
							onChange={handleChange}
							error={errorFor("nombreUsuario")}
						/>
						<TextField
							id="email"
							name="email"
							label="Correo electrónico"
							type="email"
							pattern={emailPattern}
							maxLength={fieldLimits.email}
							title="Usa un correo con dominio, por ejemplo tu@correo.com"
							autoComplete="email"
							required
							value={formData.email}
							onChange={handleChange}
							error={errorFor("email")}
						/>
						<TextField
							id="cc"
							name="cc"
							label="Cédula de identidad"
							type="text"
							inputMode="numeric"
							pattern="[1-9][0-9]*"
							maxLength={fieldLimits.cc}
							title="La cédula debe ser un número entero mayor que 0"
							autoComplete="off"
							required
							value={formData.cc}
							onChange={handleChange}
							error={errorFor("cc")}
						/>
						<TextField
							id="celular"
							name="celular"
							label="Celular"
							type="tel"
							pattern="[0-9]{7,15}"
							maxLength={fieldLimits.celular}
							title="Ingresa entre 7 y 15 dígitos"
							autoComplete="tel"
							required
							value={formData.celular}
							onChange={handleChange}
							error={errorFor("celular")}
						/>

						{error && (
							<Alert tone="error" className="sm:col-span-2">
								{error}
							</Alert>
						)}
						{success && (
							<Alert tone="success" className="sm:col-span-2">
								{success}
							</Alert>
						)}

						<div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
							<Link
								to="/inicio"
								className={buttonClasses({ variant: "outline" })}
							>
								Cancelar
							</Link>
							<Button
								type="submit"
								loading={isSubmitting}
								disabled={!hasChanges}
							>
								{isSubmitting ? "Guardando..." : "Guardar cambios"}
							</Button>
						</div>
					</form>
				</section>
			)}
		</>
	);
}

export default Profile;
