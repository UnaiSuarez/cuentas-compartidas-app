import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  doc, getDoc, collection,
  onSnapshot, query, orderBy,
  updateDoc, serverTimestamp,
} from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth, db }  from '../config/firebase'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}

export function AppProvider({ children }) {
  const [firebaseUser,  setFirebaseUser]  = useState(undefined)
  const [userProfile,   setUserProfile]   = useState(null)
  const [groupId,       setGroupId]       = useState(null)
  const [userGroupIds,  setUserGroupIds]  = useState([])
  const [userRooms,     setUserRooms]     = useState([])

  const [groupInfo,     setGroupInfo]     = useState(null)
  const [groupMembers,  setGroupMembers]  = useState([])
  const [transactions,  setTransactions]  = useState([])
  const [messages,      setMessages]      = useState([])
  const [categories,    setCategories]    = useState(defaultCategories())
  const [groupSettings, setGroupSettings] = useState(null)

  // En móvil siempre dark por defecto; persiste con AsyncStorage
  const [darkMode,  setDarkMode]  = useState(true)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const unsubTxRef    = useRef(null)
  const unsubMsgRef   = useRef(null)
  const unsubGroupRef = useRef(null)

  const isAdmin = userProfile?.id != null && groupInfo?.createdBy === userProfile.id

  // Carga preferencia de tema guardada
  useEffect(() => {
    AsyncStorage.getItem('theme').then(t => {
      if (t !== null) setDarkMode(t !== 'light')
    })
  }, [])

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev
      AsyncStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (!fbUser) {
        cancelListeners()
        resetData()
        setLoading(false)
        return
      }

      try {
        const profileDoc = await getDoc(doc(db, 'users', fbUser.uid))
        if (profileDoc.exists()) {
          const profile = { id: fbUser.uid, ...profileDoc.data() }
          setUserProfile(profile)

          const gIds = profile.groupIds?.length
            ? profile.groupIds
            : profile.groupId ? [profile.groupId] : []
          setUserGroupIds(gIds)

          const rooms = await loadUserRooms(gIds)
          setUserRooms(rooms)

          // Restaura sala activa desde AsyncStorage
          const storedId = await AsyncStorage.getItem(`activeGroup_${fbUser.uid}`)
          if (storedId && gIds.includes(storedId)) {
            setGroupId(storedId)
            subscribeToGroup(storedId)
          }
        } else {
          setUserProfile(null)
        }
      } catch (e) {
        setError('Error al cargar el perfil: ' + e.message)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  function cancelListeners() {
    unsubTxRef.current?.()
    unsubMsgRef.current?.()
    unsubGroupRef.current?.()
  }

  function resetData() {
    setUserProfile(null)
    setGroupId(null)
    setUserGroupIds([])
    setUserRooms([])
    setGroupInfo(null)
    setGroupMembers([])
    setTransactions([])
    setMessages([])
    setGroupSettings(null)
  }

  function resetGroupData() {
    setGroupInfo(null)
    setGroupMembers([])
    setTransactions([])
    setMessages([])
    setGroupSettings(null)
    setCategories(defaultCategories())
  }

  const subscribeToGroup = useCallback((gId) => {
    cancelListeners()

    unsubGroupRef.current = onSnapshot(doc(db, 'groups', gId), async (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      setGroupSettings(data.settings || null)
      if (data.categories) setCategories(data.categories)
      setGroupInfo({
        name:      data.name,
        code:      data.code,
        createdBy: data.createdBy,
        memberIds: data.memberIds,
      })
      const memberProfiles = await loadMemberProfiles(data.memberIds || [])
      setGroupMembers(memberProfiles)
    })

    unsubTxRef.current = onSnapshot(
      query(collection(db, 'groups', gId, 'transactions'), orderBy('date', 'desc')),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )

    unsubMsgRef.current = onSnapshot(
      query(collection(db, 'groups', gId, 'messages'), orderBy('createdAt', 'desc')),
      (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  async function switchActiveGroup(newGroupId) {
    cancelListeners()
    resetGroupData()
    setGroupId(newGroupId)
    if (firebaseUser) {
      await AsyncStorage.setItem(`activeGroup_${firebaseUser.uid}`, newGroupId)
    }
    subscribeToGroup(newGroupId)
  }

  async function clearActiveGroup() {
    cancelListeners()
    resetGroupData()
    setGroupId(null)
    if (firebaseUser) {
      await AsyncStorage.removeItem(`activeGroup_${firebaseUser.uid}`)
    }
  }

  async function loadMemberProfiles(uids) {
    if (!uids.length) return []
    const profiles = await Promise.all(
      uids.map(async uid => {
        const snap = await getDoc(doc(db, 'users', uid))
        return snap.exists() ? { id: uid, ...snap.data() } : null
      })
    )
    return profiles.filter(Boolean)
  }

  async function loadUserRooms(groupIds) {
    if (!groupIds.length) return []
    const snaps = await Promise.all(groupIds.map(id => getDoc(doc(db, 'groups', id))))
    return snaps
      .filter(s => s.exists())
      .map(s => ({
        id:          s.id,
        name:        s.data().name,
        code:        s.data().code,
        memberCount: s.data().memberIds?.length || 0,
        createdBy:   s.data().createdBy,
      }))
  }

  async function updateUserProfile(data) {
    if (!firebaseUser) return
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    setUserProfile(prev => ({ ...prev, ...data }))
  }

  async function updateGroupCategories(newCategories) {
    if (!groupId) return
    await updateDoc(doc(db, 'groups', groupId), {
      categories: newCategories,
      updatedAt:  serverTimestamp(),
    })
  }

  async function updateGroupName(newName) {
    if (!groupId || !isAdmin) return
    await updateDoc(doc(db, 'groups', groupId), {
      name:      newName,
      updatedAt: serverTimestamp(),
    })
    setGroupInfo(prev => ({ ...prev, name: newName }))
  }

  async function logout() {
    cancelListeners()
    resetData()
    await signOut(auth)
  }

  async function onProfileCreated(profile, newGroupId) {
    setUserProfile(profile)
    const gIds = profile.groupIds?.length
      ? profile.groupIds
      : profile.groupId ? [profile.groupId] : []
    setUserGroupIds(gIds)

    const rooms = await loadUserRooms(gIds)
    setUserRooms(rooms)

    if (newGroupId) {
      setGroupId(newGroupId)
      if (profile.id) {
        await AsyncStorage.setItem(`activeGroup_${profile.id}`, newGroupId)
      }
      subscribeToGroup(newGroupId)
    }
  }

  const value = {
    firebaseUser, userProfile, groupId,
    userGroupIds, userRooms,
    groupInfo, groupMembers,
    transactions, messages,
    categories, groupSettings,
    isAdmin,
    loading, error, setError,
    logout, updateUserProfile,
    updateGroupCategories, updateGroupName,
    switchActiveGroup, clearActiveGroup,
    onProfileCreated,
    darkMode, toggleDarkMode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
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
