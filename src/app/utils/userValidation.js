import { z } from "zod";

const letters = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";

// El guion va escapado: el atributo pattern del input se compila con el modo /v,
// que no acepta "-" suelto en una clase (esto sigue igual, es para el HTML pattern)
const namePattern = `[${letters}]+(?:[ '\\-][${letters}]+)*`;

const nameRegex = new RegExp(`^${namePattern}$`);

// Largo máximo de cada columna de la tabla usuarios
const fieldLimits = {
	nombres: 50,
	apellidos: 50,
	email: 100,
	cc: 15,
	celular: 15,
	nombreUsuario: 30,
};

const nameSchema = (label) =>
	z
		.string()
		.trim()
		.regex(
			nameRegex,
			`${label} solo pueden contener letras, espacios, apóstrofes o guiones.`,
		);

// Reglas de los datos del perfil (las mismas del registro en BiblioTK-front, sin la contraseña:
// este formulario no la tiene y, si el esquema la exige, "Guardar cambios" nunca pasa la validación)
const userDataSchema = z.object({
	nombres: nameSchema("Los nombres").max(fieldLimits.nombres),
	apellidos: nameSchema("Los apellidos").max(fieldLimits.apellidos),
	cc: z
		.string()
		.trim()
		.regex(/^[1-9]\d*$/, "La cédula debe ser un número entero mayor que 0.")
		.max(
			fieldLimits.cc,
			`La cédula debe tener hasta ${fieldLimits.cc} dígitos.`,
		),
	email: z
		.email("Ingresa un correo válido, por ejemplo: tu@correo.com.")
		.trim()
		.max(fieldLimits.email),
	celular: z
		.string()
		.trim()
		.regex(
			/^\d{7,15}$/,
			"El celular debe contener solo números, entre 7 y 15 dígitos.",
		),
	nombreUsuario: z
		.string()
		.trim()
		.min(1, "Ingresa un nombre de usuario.")
		.max(
			fieldLimits.nombreUsuario,
			`El nombre de usuario debe tener máximo ${fieldLimits.nombreUsuario} caracteres.`,
		),
});

// Mantiene el contrato { field, message } | null que usa el perfil
function validateUserData(formData) {
	const result = userDataSchema.safeParse(formData);

	if (result.success) {
		return null;
	}

	const firstIssue = result.error.issues[0];

	return {
		field: firstIssue.path[0],
		message: firstIssue.message,
	};
}

export { validateUserData };
