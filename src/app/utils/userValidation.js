const letters = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";

export const namePattern = `[${letters}]+(?:[ '\\-][${letters}]+)*`;
export const emailPattern = "[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}";
export const fieldLimits = {
	nombres: 50,
	apellidos: 50,
	email: 100,
	cc: 15,
	celular: 15,
	nombreUsuario: 30,
};

const nameRegex = new RegExp(`^${namePattern}$`);
const emailRegex = new RegExp(`^${emailPattern}$`);

export function validateUserData(formData) {
	if (!nameRegex.test(formData.nombres.trim())) {
		return {
			field: "nombres",
			message:
				"Los nombres solo pueden contener letras, espacios, apóstrofes o guiones.",
		};
	}

	if (!nameRegex.test(formData.apellidos.trim())) {
		return {
			field: "apellidos",
			message:
				"Los apellidos solo pueden contener letras, espacios, apóstrofes o guiones.",
		};
	}

	if (!/^[1-9]\d*$/.test(formData.cc.trim())) {
		return {
			field: "cc",
			message: "La cédula debe ser un número entero mayor que 0.",
		};
	}

	if (!emailRegex.test(formData.email.trim())) {
		return {
			field: "email",
			message: "Ingresa un correo válido, por ejemplo: tu@correo.com.",
		};
	}

	if (!/^\d{7,15}$/.test(formData.celular.trim())) {
		return {
			field: "celular",
			message: "El celular debe contener solo números, entre 7 y 15 dígitos.",
		};
	}

	if (!formData.nombreUsuario.trim()) {
		return {
			field: "nombreUsuario",
			message: "Ingresa un nombre de usuario.",
		};
	}

	return null;
}
