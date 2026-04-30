/**
 * Hook para todas las operaciones CRUD de transacciones.
 *
 * Las transacciones se guardan en:
 *   /groups/{groupId}/transactions/{txId}
 */

import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useApp } from '../context/AppContext'

export function useTransactions() {
  const { groupId, userProfile, categories } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  async function createTransaction(data) {
    if (!groupId) { setError('Sin grupo activo'); return }
    setSubmitting(true)
    setError(null)
    try {
      const categoryLabel = categories.find(c => c.id === data.category)?.label || data.category

      const dateObj = data.date instanceof Date ? data.date : new Date(data.date)

      await addDoc(collection(db, 'groups', groupId, 'transactions'), {
        type:          data.type,
        paymentMode:   data.paymentMode || 'individual',
        amount:        Number(data.amount),
        category:      data.category || 'other',
        categoryLabel,
        description:   data.description || '',
        paidBy:        data.paidBy,
        splitAmong:    data.splitAmong || [],
        date:          Timestamp.fromDate(dateObj),
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
        createdBy:     userProfile?.id || '',
      })
    } catch (e) {
      setError('Error al guardar la transacción: ' + e.message)
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  async function updateTransaction(txId, data) {
    if (!groupId) return
    setSubmitting(true)
    setError(null)
    try {
      const categoryLabel = data.category
        ? (categories.find(c => c.id === data.category)?.label || data.category)
        : undefined

      const dateObj = data.date
        ? (data.date instanceof Date ? data.date : new Date(data.date))
        : undefined

      await updateDoc(doc(db, 'groups', groupId, 'transactions', txId), {
        ...data,
        ...(categoryLabel !== undefined && { categoryLabel }),
        ...(dateObj       !== undefined && { date: Timestamp.fromDate(dateObj) }),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      setError('Error al actualizar: ' + e.message)
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteTransaction(txId) {
    if (!groupId) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteDoc(doc(db, 'groups', groupId, 'transactions', txId))
    } catch (e) {
      setError('Error al eliminar: ' + e.message)
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  return { createTransaction, updateTransaction, deleteTransaction, submitting, error, setError }
}
