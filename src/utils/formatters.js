import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/** Timezone de España — se usa en todos los formateos de fecha */
const LOCALE = es

/**
 * Formatea un número como moneda (€).
 * @param {number} amount
 * @param {boolean} showSign - Si true, muestra + en positivos
 */
export function formatCurrency(amount, showSign = false) {
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  if (showSign && amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

/**
 * Normaliza distintos formatos de fecha a un objeto Date.
 * Soporta: Date, string ISO, Firestore Timestamp (con .toDate()).
 * @param {any} date
 * @returns {Date|null}
 */
function toDate(date) {
  if (!date) return null
  if (date?.toDate) return date.toDate()         // Firestore Timestamp
  if (date instanceof Date) return date
  if (typeof date === 'string') {
    const d = parseISO(date)
    return isValid(d) ? d : null
  }
  return null
}

/**
 * Formatea una fecha a formato legible en español (timezone Europe/Madrid).
 * Acepta Date, string ISO, Firestore Timestamp.
 *
 * @param {any}     date
 * @param {boolean} withTime - Si true incluye hora (hh:mm)
 */
export function formatDate(date, withTime = false) {
  const d = toDate(date)
  if (!d || !isValid(d)) return '—'
  const pattern = withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'
  return format(d, pattern, { locale: LOCALE })
}

/**
 * Devuelve tiempo relativo en español: "hace 2 horas".
 * @param {string|Date} date
 */
export function timeAgo(date) {
  const d = toDate(date)
  if (!d || !isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: LOCALE })
}

/**
 * Devuelve el nombre del mes en español.
 * @param {any} date
 */
export function monthName(date) {
  const d = toDate(date)
  if (!d || !isValid(d)) return '—'
  return format(d, 'MMMM yyyy', { locale: LOCALE })
}

/**
 * Devuelve clase de color según si el importe es positivo o negativo.
 * @param {number} amount
 */
export function amountColor(amount) {
  if (amount > 0) return 'text-emerald-400'
  if (amount < 0) return 'text-red-400'
  return 'text-slate-400'
}

/**
 * Trunca un texto a maxLength caracteres añadiendo "...".
 */
export function truncate(text, maxLength = 30) {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
