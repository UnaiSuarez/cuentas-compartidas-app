/**
 * Notificaciones push enviadas directamente desde el cliente a la API de Expo.
 * No requiere servidor ni Firebase Cloud Functions — es completamente gratuito.
 *
 * Flujo: usuario hace acción → su app llama a esta utilidad →
 *   se obtienen los tokens de los demás miembros (ya en groupMembers) →
 *   petición POST a https://exp.host/--/api/v2/push/send
 */

import { calculateBalances } from './calculateSettlement'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Cooldown en memoria para no spamear notificaciones de saldo en la misma sesión
const cooldowns = new Map()
function cooldownOk(key, ms = 6 * 3_600_000) {
  const last = cooldowns.get(key) || 0
  if (Date.now() - last < ms) return false
  cooldowns.set(key, Date.now())
  return true
}

async function post(messages) {
  const valid = messages.filter(m => m.to?.startsWith('ExponentPushToken'))
  if (!valid.length) return
  try {
    await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify(valid),
    })
  } catch (e) {
    console.warn('[push]', e.message)
  }
}

function tokensOf(members, excludeId = null) {
  return members
    .filter(m => m.id !== excludeId)
    .map(m => m.pushToken)
    .filter(t => t?.startsWith('ExponentPushToken'))
}

// ─── Nuevo mensaje de chat ────────────────────────────────────────────────────
export async function notifyNewMessage(senderName, text, groupMembers, senderId) {
  const tokens = tokensOf(groupMembers, senderId)
  await post(tokens.map(to => ({
    to,
    title: `💬 ${senderName}`,
    body:  text.substring(0, 120),
    sound: 'default',
    data:  { screen: 'chat' },
  })))
}

// ─── Recordatorio de pago ─────────────────────────────────────────────────────
// fromMember = quien debe, toMember = quien cobra
export async function notifyPaymentReminder(fromMember, toMember, amount) {
  if (!fromMember?.pushToken?.startsWith('ExponentPushToken')) return
  await post([{
    to:    fromMember.pushToken,
    title: '💸 Recordatorio de pago',
    body:  `${toMember?.name || 'alguien'} te recuerda que le debes ${amount.toFixed(2)}€. ¡No lo dejes para mañana!`,
    sound: 'default',
    data:  { screen: 'liquidacion' },
  }])
}

// ─── Nueva transacción ────────────────────────────────────────────────────────
export async function notifyNewTransaction(tx, senderName, groupMembers, senderId) {
  const tokens = tokensOf(groupMembers, senderId)
  const emoji  = tx.type === 'income' ? '💰' : '🧾'
  const verb   = tx.type === 'income' ? 'ingresó' : 'añadió un gasto de'
  const cat    = tx.categoryLabel || tx.category || ''
  const body   = `${senderName} ${verb} ${tx.amount}€${cat ? ` — ${cat}` : ''}`

  await post(tokens.map(to => ({
    to, title: `${emoji} Nuevo movimiento`, body,
    sound: 'default', data: { screen: 'transacciones' },
  })))
}

// ─── Nuevo miembro en el grupo ────────────────────────────────────────────────
// existingMembers = miembros ANTES de que el nuevo entrara
export async function notifyNewMember(newMemberName, existingMembers, groupName) {
  const tokens = tokensOf(existingMembers)
  await post(tokens.map(to => ({
    to,
    title: '👋 Nuevo miembro',
    body:  `${newMemberName} se ha unido a ${groupName}. ¡Dale la bienvenida!`,
    sound: 'default',
    data:  { screen: 'ajustes' },
  })))
}

// ─── Aviso de saldo extremo ───────────────────────────────────────────────────
// Llama tras cada transacción nueva para avisar si alguien está muy en rojo/verde.
export async function checkBalancesAndNotify(allTransactions, groupMembers) {
  if (!allTransactions.length || !groupMembers.length) return

  const balances = calculateBalances(allTransactions, groupMembers)
  const messages = []

  for (const member of groupMembers) {
    const bal   = balances[member.id] ?? 0
    const token = member.pushToken
    if (!token?.startsWith('ExponentPushToken')) continue

    const name = member.name || 'Tu avatar'

    if (bal < -50 && cooldownOk(`neg_${member.id}`)) {
      messages.push({
        to:    token,
        title: '😵 Avatar en coma financiero',
        body:  `${name}, debes ${Math.abs(Math.round(bal))}€ al grupo. ¡Ingresa algo y resucítalo!`,
        sound: 'default',
        data:  { screen: 'liquidacion' },
      })
    } else if (bal > 100 && cooldownOk(`pos_${member.id}`)) {
      messages.push({
        to:    token,
        title: '🤑 ¡Estás forrado!',
        body:  `${name}, tienes ${Math.round(bal)}€ a favor. ¡Bien jugado, tacaño!`,
        sound: 'default',
        data:  { screen: 'inicio' },
      })
    }
  }

  if (messages.length) await post(messages)
}
