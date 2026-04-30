import { useState } from 'react'
import {
  collection, addDoc, updateDoc, doc,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useApp } from '../context/AppContext'
import {
  notifyNewMessage,
  notifyPaymentReminder,
} from '../utils/pushNotifications'

export function useChat() {
  const { groupId, userProfile, groupMembers, messages } = useApp()
  const [sending, setSending] = useState(false)

  async function sendMessage(text) {
    if (!text.trim() || !userProfile || !groupId) return
    setSending(true)
    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        type:         'message',
        text:         text.trim(),
        sender:       userProfile.id,
        senderName:   userProfile.name,
        senderAvatar: userProfile.avatar,
        readBy:       [userProfile.id],
        createdAt:    serverTimestamp(),
      })
      // Push a los demás miembros — gratuito, directo a Expo API
      await notifyNewMessage(userProfile.name, text.trim(), groupMembers, userProfile.id)
    } finally {
      setSending(false)
    }
  }

  async function sendPaymentReminder(fromUserId, toUserId, amount, members) {
    if (!groupId) return
    const allMembers = members?.length ? members : groupMembers
    const fromName = allMembers.find(m => m.id === fromUserId)?.name || 'Alguien'
    const toName   = allMembers.find(m => m.id === toUserId)?.name   || 'alguien'

    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      type:       'payment_reminder',
      text:       `💸 Recordatorio: ${fromName} debe ${amount.toFixed(2)}€ a ${toName}`,
      sender:     userProfile?.id || fromUserId,
      senderName: 'Sistema',
      readBy:     [],
      fromUserId,
      toUserId,
      amount,
      createdAt:  serverTimestamp(),
    })

    // Notifica solo al deudor (fromUserId)
    const fromMember = allMembers.find(m => m.id === fromUserId)
    const toMember   = allMembers.find(m => m.id === toUserId)
    await notifyPaymentReminder(fromMember, toMember, amount)
  }

  async function sendSystemMessage(text) {
    if (!groupId) return
    await addDoc(collection(db, 'groups', groupId, 'messages'), {
      type:       'system',
      text,
      sender:     userProfile?.id || 'system',
      senderName: 'Sistema',
      readBy:     [],
      createdAt:  serverTimestamp(),
    })
  }

  async function markAsRead(messageId) {
    if (!userProfile || !groupId) return
    const msg = messages.find(m => m.id === messageId)
    if (!msg || msg.readBy?.includes(userProfile.id)) return
    await updateDoc(doc(db, 'groups', groupId, 'messages', messageId), {
      readBy: arrayUnion(userProfile.id),
    })
  }

  const unreadCount = userProfile
    ? messages.filter(m =>
        m.type !== 'system' &&
        m.sender !== userProfile.id &&
        !m.readBy?.includes(userProfile.id)
      ).length
    : 0

  return { sendMessage, sendPaymentReminder, sendSystemMessage, markAsRead, sending, unreadCount }
}
