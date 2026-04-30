import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, addDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth, db }     from '../config/firebase'
import { useApp }       from '../context/AppContext'
import { notifyNewMember } from '../utils/pushNotifications'

export function useAuth() {
  const { onProfileCreated } = useApp()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function signUp(email, password) {
    setLoading(true); setError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email, name: '', avatar: 'avatar0',
        groupIds: [], color: randomColor(),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      return cred
    } catch (e) {
      setError(translateFirebaseError(e.code)); throw e
    } finally { setLoading(false) }
  }

  async function login(email, password) {
    setLoading(true); setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setError(translateFirebaseError(e.code)); throw e
    } finally { setLoading(false) }
  }

  async function resetPassword(email) {
    setLoading(true); setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      setError(translateFirebaseError(e.code)); throw e
    } finally { setLoading(false) }
  }

  async function completeProfile(uid, name, avatar, color) {
    await updateDoc(doc(db, 'users', uid), {
      name, avatar, color, updatedAt: serverTimestamp(),
    })
  }

  async function createGroup(uid, groupName) {
    setLoading(true); setError(null)
    try {
      const code     = generateGroupCode()
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName, code: code.toUpperCase(),
        memberIds: [uid], createdBy: uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        settings: { timezone: 'Europe/Madrid', currency: 'EUR' },
        categories: defaultCategories(),
      })
      await updateDoc(doc(db, 'users', uid), {
        groupIds: arrayUnion(groupRef.id), updatedAt: serverTimestamp(),
      })
      const profileSnap = await getDoc(doc(db, 'users', uid))
      const profile = { id: uid, ...profileSnap.data() }
      await onProfileCreated(profile, groupRef.id)
      return groupRef.id
    } catch (e) {
      setError('Error al crear el grupo: ' + e.message); throw e
    } finally { setLoading(false) }
  }

  async function joinGroup(uid, code) {
    setLoading(true); setError(null)
    try {
      const q    = query(collection(db, 'groups'), where('code', '==', code.toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) { setError('Código de grupo no encontrado.'); throw new Error('No encontrado') }

      const groupDoc  = snap.docs[0]
      const groupData = groupDoc.data()
      if (groupData.memberIds.includes(uid)) { setError('Ya eres miembro de este grupo.'); throw new Error('Ya miembro') }
      if (groupData.memberIds.length >= 10)  { setError('El grupo está lleno (máximo 10).'); throw new Error('Lleno') }

      // Notificar a los miembros existentes ANTES de añadir al nuevo
      const existingMemberDocs = await Promise.all(
        groupData.memberIds.map(id => getDoc(doc(db, 'users', id)))
      )
      const existingMembers = existingMemberDocs
        .filter(d => d.exists())
        .map(d => ({ id: d.id, ...d.data() }))

      await updateDoc(groupDoc.ref, { memberIds: arrayUnion(uid), updatedAt: serverTimestamp() })
      await updateDoc(doc(db, 'users', uid), { groupIds: arrayUnion(groupDoc.id), updatedAt: serverTimestamp() })
      const profileSnap = await getDoc(doc(db, 'users', uid))
      const profile = { id: uid, ...profileSnap.data() }

      // Enviar push a los miembros existentes con el nombre del nuevo
      await notifyNewMember(profile.name || 'Alguien', existingMembers, groupData.name)

      await onProfileCreated(profile, groupDoc.id)
      return groupDoc.id
    } catch (e) {
      if (!error) setError('Error al unirse al grupo: ' + e.message); throw e
    } finally { setLoading(false) }
  }

  async function leaveGroup(uid, groupId) {
    setLoading(true); setError(null)
    try {
      const groupSnap = await getDoc(doc(db, 'groups', groupId))
      if (!groupSnap.exists()) throw new Error('Sala no encontrada')
      const groupData  = groupSnap.data()
      const isAdmin    = groupData.createdBy === uid
      const remaining  = groupData.memberIds.filter(id => id !== uid)
      const groupUpdate = { memberIds: arrayRemove(uid), updatedAt: serverTimestamp() }
      if (isAdmin && remaining.length > 0) groupUpdate.createdBy = remaining[0]
      await updateDoc(doc(db, 'groups', groupId), groupUpdate)
      await updateDoc(doc(db, 'users', uid), { groupIds: arrayRemove(groupId), updatedAt: serverTimestamp() })
      await AsyncStorage.removeItem(`activeGroup_${uid}`)
    } catch (e) {
      setError('Error al salir de la sala: ' + e.message); throw e
    } finally { setLoading(false) }
  }

  async function removeMember(adminUid, targetUid, groupId) {
    setLoading(true); setError(null)
    try {
      const groupSnap = await getDoc(doc(db, 'groups', groupId))
      if (!groupSnap.exists()) throw new Error('Sala no encontrada')
      if (groupSnap.data().createdBy !== adminUid) throw new Error('Sin permisos')
      await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayRemove(targetUid), updatedAt: serverTimestamp() })
      await updateDoc(doc(db, 'users', targetUid), { groupIds: arrayRemove(groupId), updatedAt: serverTimestamp() })
    } catch (e) {
      setError('Error al eliminar miembro: ' + e.message); throw e
    } finally { setLoading(false) }
  }

  return { signUp, login, resetPassword, completeProfile, createGroup, joinGroup, leaveGroup, removeMember, loading, error, setError }
}

function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomColor() {
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  return colors[Math.floor(Math.random() * colors.length)]
}

function translateFirebaseError(code) {
  const map = {
    'auth/email-already-in-use':   'Ese correo ya tiene cuenta. Inicia sesión.',
    'auth/invalid-email':          'El correo no tiene formato válido.',
    'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found':         'No existe cuenta con ese correo.',
    'auth/wrong-password':         'Contraseña incorrecta.',
    'auth/too-many-requests':      'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
    'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  }
  return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.'
}

function defaultCategories() {
  return [
    { id: 'food',      label: 'Comida',      icon: '🍔', suggestedAmount: 50  },
    { id: 'transport', label: 'Transporte',   icon: '🚗', suggestedAmount: 30  },
    { id: 'home',      label: 'Casa / Hogar', icon: '🏠', suggestedAmount: 200 },
    { id: 'leisure',   label: 'Ocio',         icon: '🎮', suggestedAmount: 40  },
    { id: 'health',    label: 'Salud',        icon: '💊', suggestedAmount: 25  },
    { id: 'shopping',  label: 'Compras',      icon: '🛍️',suggestedAmount: 60  },
    { id: 'bills',     label: 'Facturas',     icon: '📄', suggestedAmount: 80  },
    { id: 'travel',    label: 'Viajes',       icon: '✈️', suggestedAmount: 150 },
    { id: 'education', label: 'Educación',    icon: '📚', suggestedAmount: 50  },
    { id: 'income',    label: 'Ingreso',      icon: '💰', suggestedAmount: 0   },
    { id: 'other',     label: 'Otros',        icon: '📦', suggestedAmount: 20  },
  ]
}
