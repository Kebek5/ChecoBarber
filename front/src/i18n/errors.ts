import type { Lang } from './ui'

// Mensajes que llegan en español desde el backend (userError) o los casos de uso, con su versión en inglés.
// Si aparece un mensaje nuevo sin traducir, se muestra en español: basta con agregarlo aquí.
const EN: Record<string, string> = {
   // Inicio de sesión y registro
   'Correo o contraseña incorrectos.': 'Incorrect email or password.',
   'Ese correo ya está registrado.': 'That email is already registered.',
   'La contraseña debe tener al menos 8 caracteres.': 'The password must be at least 8 characters long.',
   'Escribe tu nombre completo.': 'Enter your full name.',
   'El teléfono debe tener 10 dígitos.': 'The phone number must have 10 digits.',
   'El correo electrónico no es válido.': 'The email address is not valid.',
   'Sesión no válida.': 'Invalid session.',

   // Citas
   'Elige una fecha válida.': 'Choose a valid date.',
   'Elige un servicio.': 'Choose a service.',
   'Elige un horario.': 'Choose a time.',
   'Elige un horario válido.': 'Choose a valid time.',
   'El servicio no existe.': 'The service does not exist.',
   'Ese horario ya no está disponible. Elige otro.': 'That time is no longer available. Choose another one.',
   'Ese horario ya fue tomado. Elige otro.': 'That time slot was just taken. Choose another one.',

   // Conexión
   'No se pudo conectar con el servidor. Intenta de nuevo en un momento.':
      'Could not connect to the server. Please try again in a moment.',
}

export function translateError(lang: Lang, message: string): string {
   if (lang === 'es') return message
   return EN[message] ?? message
}