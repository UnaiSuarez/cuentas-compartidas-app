/**
 * Cloud Functions para Cuentas Compartidas.
 *
 * Notificaciones push enviadas a través de la Expo Push API.
 *
 * Triggers:
 *   onNewMessage       — nuevo mensaje en el chat del grupo
 *   onNewTransaction   — nueva transacción añadida
 *   onGroupUpdated     — nuevo miembro se une al grupo
 *   (balance warnings) — saldo muy negativo o muy positivo tras cada transacción
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const admin  = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

async function sendPush(tokens, title, body, data = {}) {
  const valid = (Array.isArray(tokens) ? tokens : [tokens])
    .filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken'))

  if (!valid.length) return

  const messages = valid.map(to => ({
    to, title, body,
    sound: 'default',
    channelId: 'default',
    data,
  }))

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify(messages),
    })
    if (!res.ok) console.error('Expo push error:', await res.text())
  } catch (e) {
    console.error('sendPush failed:', e.message)
  }
}

async function getMemberTokens(groupId, excludeUid = null) {
  const group = await db.doc(`groups/${groupId}`).get()
  if (!group.exists) return []

  const memberIds = (group.data().memberIds || [])
    .filter(id => id !== excludeUid)

  const userDocs = await Promise.all(memberIds.map(uid => db.doc(`users/${uid}`).get()))
  return userDocs.map(d => d.data()?.pushToken).filter(Boolean)
}

async function getUserData(uid) {
  const snap = await db.doc(`users/${uid}`).get()
  return snap.exists ? snap.data() : null
}

/** Evita spam: solo envía si han pasado <hours> horas desde el último de ese tipo */
async function checkCooldown(uid, type, hours = 6) {
  const ref  = db.doc(`notificationCooldowns/${uid}`)
  const snap = await ref.get()
  const last = (snap.data() || {})[type]?.toMillis() || 0

  if (Date.now() - last < hours * 3_600_000) return false

  await ref.set({ [type]: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de saldos (misma lógica que el cliente)
// ─────────────────────────────────────────────────────────────────────────────

function calculateBalances(transactions, memberIds) {
  const balances = {}
  memberIds.forEach(id => { balances[id] = 0 })

  for (const tx of transactions) {
    const amount  = tx.amount || 0
    const paidBy  = tx.paidBy
    const members = tx.splitAmong || []
    if (!members.length) continue

    const share = amount / members.length

    if (tx.type === 'income') {
      if (balances[paidBy] !== undefined) balances[paidBy] += amount
    } else if (tx.paymentMode === 'external') {
      if (balances[paidBy] !== undefined) balances[paidBy] += amount
      members.forEach(uid => { if (balances[uid] !== undefined) balances[uid] -= share })
    } else {
      // Gasto normal: solo debita a los participantes
      members.forEach(uid => { if (balances[uid] !== undefined) balances[uid] -= share })
    }
  }

  return balances
}

// ─────────────────────────────────────────────────────────────────────────────
// Función compartida: avisos de saldo tras añadir una transacción
// ─────────────────────────────────────────────────────────────────────────────

async function notifyBalanceWarnings(groupId) {
  const groupSnap = await db.doc(`groups/${groupId}`).get()
  if (!groupSnap.exists) return
  const memberIds = groupSnap.data().memberIds || []

  const txSnap = await db.collection(`groups/${groupId}/transactions`).get()
  const transactions = txSnap.docs.map(d => d.data())

  const balances = calculateBalances(transactions, memberIds)

  for (const [uid, bal] of Object.entries(balances)) {
    const rounded = Math.round(bal)

    if (bal < -50) {
      const ok = await checkCooldown(uid, 'negative', 6)
      if (!ok) continue
      const user = await getUserData(uid)
      if (!user?.pushToken) continue
      const name = user.name || 'Tu avatar'
      await sendPush(
        [user.pushToken],
        '😵 Avatar en coma financiero',
        `${name}, debes ${Math.abs(rounded)}€ al grupo. ¡Ingresa algo y resucítalo!`,
        { screen: 'liquidacion' }
      )
    } else if (bal > 100) {
      const ok = await checkCooldown(uid, 'positive', 12)
      if (!ok) continue
      const user = await getUserData(uid)
      if (!user?.pushToken) continue
      const name = user.name || 'Tu avatar'
      await sendPush(
        [user.pushToken],
        '🤑 ¡Estás forrado!',
        `${name}, tienes ${rounded}€ a favor en el grupo. ¡Bien jugado!`,
        { screen: 'inicio' }
      )
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger 1: Nuevo mensaje en el chat
// ─────────────────────────────────────────────────────────────────────────────

exports.onNewMessage = onDocumentCreated(
  'groups/{groupId}/messages/{msgId}',
  async (event) => {
    const msg = event.data.data()

    // Mensajes de sistema no generan push
    if (msg.type === 'system') return

    const { groupId } = event.params

    if (msg.type === 'payment_reminder') {
      // Solo notifica al deudor específico
      const target = await getUserData(msg.fromUserId)
      if (!target?.pushToken) return

      const creditorName = msg.toUserId
        ? (await getUserData(msg.toUserId))?.name || 'alguien'
        : 'alguien'

      await sendPush(
        [target.pushToken],
        '💸 Recordatorio de pago',
        `${creditorName} te recuerda que le debes ${msg.amount?.toFixed(2) ?? '?'}€. ¡Dale!`,
        { screen: 'liquidacion' }
      )
      return
    }

    // Mensaje normal: notifica a todos menos al remitente
    const tokens = await getMemberTokens(groupId, msg.sender)
    if (!tokens.length) return

    const preview = (msg.text || '').substring(0, 100)
    await sendPush(
      tokens,
      `💬 ${msg.senderName || 'Mensaje nuevo'}`,
      preview,
      { screen: 'chat', groupId }
    )
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Trigger 2: Nueva transacción
// ─────────────────────────────────────────────────────────────────────────────

exports.onNewTransaction = onDocumentCreated(
  'groups/{groupId}/transactions/{txId}',
  async (event) => {
    const tx = event.data.data()
    const { groupId } = event.params

    const creator = await getUserData(tx.createdBy)
    const name    = creator?.name || 'Alguien'

    const tokens = await getMemberTokens(groupId, tx.createdBy)

    if (tokens.length) {
      const emoji = tx.type === 'income' ? '💰' : '🧾'
      const verb  = tx.type === 'income' ? 'ingresó' : 'añadió un gasto de'
      const cat   = tx.categoryLabel || tx.category || ''
      const body  = `${name} ${verb} ${tx.amount}€${cat ? ` — ${cat}` : ''}`

      await sendPush(tokens, `${emoji} Nuevo movimiento`, body, { screen: 'transacciones', groupId })
    }

    // Revisar saldos y avisar si alguien está muy negativo/positivo
    await notifyBalanceWarnings(groupId)
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Trigger 3: Nuevo miembro en el grupo
// ─────────────────────────────────────────────────────────────────────────────

exports.onGroupUpdated = onDocumentUpdated(
  'groups/{groupId}',
  async (event) => {
    const before = event.data.before.data()
    const after  = event.data.after.data()

    const prevIds   = before.memberIds || []
    const newIds    = after.memberIds  || []
    const joinedIds = newIds.filter(id => !prevIds.includes(id))

    if (!joinedIds.length) return

    const { groupId } = event.params
    const newMember   = await getUserData(joinedIds[0])
    const newName     = newMember?.name || 'Alguien'

    const tokens = await getMemberTokens(groupId, joinedIds[0])
    if (!tokens.length) return

    await sendPush(
      tokens,
      '👋 Nuevo miembro',
      `${newName} se ha unido a ${after.name}. ¡Dale la bienvenida!`,
      { screen: 'ajustes', groupId }
    )
  }
)
