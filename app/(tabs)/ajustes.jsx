import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Alert, Switch,
  TextInput, ActivityIndicator, Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  LogOut, Users, Hash, Moon, ChevronRight, Copy, Check,
  Crown, Tag, Plus, X, Save, Trash2, User,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

const AVATAR_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

const AVATAR_EMOJIS = [
  '😄', '🤖', '👽', '👻', '🏴‍☠️', '🥷',
  '🧙', '🚀', '🧛', '🔬', '⚔️', '🦄',
  '😺', '👨‍🍳', '🦕', '😇', '🐻', '🎧',
]

export default function AjustesScreen() {
  const router = useRouter()
  const {
    userProfile, groupId, groupInfo, groupMembers,
    isAdmin, darkMode, toggleDarkMode, logout,
    clearActiveGroup, categories,
    updateUserProfile, updateGroupCategories, updateGroupName,
  } = useApp()
  const { leaveGroup, removeMember, loading: authLoading } = useAuth()

  const [copied,         setCopied]         = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName,       setEditName]       = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [selectedColor,  setSelectedColor]  = useState(0)
  const [saving,         setSaving]         = useState(false)

  const [editingGroupName, setEditingGroupName] = useState(false)
  const [newGroupName,     setNewGroupName]     = useState('')

  const [editingCats, setEditingCats] = useState(false)
  const [catList,     setCatList]     = useState([])
  const [savingCats,  setSavingCats]  = useState(false)

  const [removingId, setRemovingId] = useState(null)

  const uid = userProfile?.id
  const avatarIdx = parseInt(userProfile?.avatar?.replace('avatar', '') || '0', 10)

  async function copyCode() {
    if (!groupInfo?.code) return
    try {
      await Share.share({ message: groupInfo.code, title: 'Código de grupo' })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  function openEditProfile() {
    const idx      = parseInt(userProfile?.avatar?.replace('avatar', '') || '0', 10)
    const colorIdx = AVATAR_COLORS.indexOf(userProfile?.color || '#2563eb')
    setEditName(userProfile?.name || '')
    setSelectedAvatar(isNaN(idx) ? 0 : idx)
    setSelectedColor(colorIdx >= 0 ? colorIdx : 0)
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateUserProfile({
        name:   editName.trim(),
        avatar: `avatar${selectedAvatar}`,
        color:  AVATAR_COLORS[selectedColor],
      })
      setEditingProfile(false)
    } finally {
      setSaving(false)
    }
  }

  function openEditCats() {
    setCatList(categories.map(c => ({ ...c })))
    setEditingCats(true)
  }

  function updateCat(i, field, value) {
    setCatList(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function addCat() {
    setCatList(prev => [...prev, {
      id:              `cat_${Date.now()}`,
      label:           'Nueva',
      icon:            '📦',
      suggestedAmount: 0,
    }])
  }

  function removeCat(i) {
    if (catList.length <= 1) return
    setCatList(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveCats() {
    setSavingCats(true)
    try {
      await updateGroupCategories(catList)
      setEditingCats(false)
    } finally {
      setSavingCats(false)
    }
  }

  async function saveGroupName() {
    if (!newGroupName.trim()) return
    await updateGroupName(newGroupName.trim())
    setEditingGroupName(false)
  }

  function handleSwitchRoom() {
    clearActiveGroup()
    router.replace('/(auth)/room-selector')
  }

  function handleLeaveGroup() {
    Alert.alert(
      'Salir del grupo',
      `¿Seguro que quieres salir de "${groupInfo?.name}"?${isAdmin && groupMembers.length > 1 ? '\n\nEres el admin. El rol pasará al siguiente miembro.' : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, abandonar',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(uid, groupId)
              clearActiveGroup()
              router.replace('/(auth)/room-selector')
            } catch (_) {}
          },
        },
      ]
    )
  }

  function handleRemoveMember(targetId, targetName) {
    Alert.alert(
      'Expulsar miembro',
      `¿Expulsar a ${targetName} del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(targetId)
            try { await removeMember(uid, targetId, groupId) }
            catch (_) {}
            finally { setRemovingId(null) }
          },
        },
      ]
    )
  }

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-white text-xl font-bold mb-6">Ajustes</Text>

        {/* ── Mi perfil ─────────────────────────────────────────────────── */}
        <View className="bg-slate-900 rounded-2xl p-5 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Mi perfil</Text>

          {!editingProfile ? (
            <View className="flex-row items-center gap-4">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: (userProfile?.color || '#2563eb') + '33' }}
              >
                <Text className="text-3xl">{AVATAR_EMOJIS[isNaN(avatarIdx) ? 0 : avatarIdx] || '😄'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{userProfile?.name}</Text>
                <Text className="text-slate-400 text-sm">{userProfile?.email}</Text>
              </View>
              <TouchableOpacity
                onPress={openEditProfile}
                className="px-3 py-1.5 bg-slate-700 rounded-lg"
              >
                <Text className="text-slate-300 text-sm">Editar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {/* Preview */}
              <View className="items-center">
                <View
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: AVATAR_COLORS[selectedColor] + '33' }}
                >
                  <Text className="text-4xl">{AVATAR_EMOJIS[selectedAvatar]}</Text>
                </View>
              </View>

              {/* Nombre */}
              <View className="relative">
                <TextInput
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white pl-11"
                  placeholder="Tu nombre"
                  placeholderTextColor="#64748b"
                  value={editName}
                  onChangeText={setEditName}
                  maxLength={30}
                />
                <View className="absolute left-3 top-0 bottom-0 justify-center">
                  <User size={16} color="#64748b" />
                </View>
              </View>

              {/* Selector de avatares */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {AVATAR_EMOJIS.map((av, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedAvatar(i)}
                    className={`mr-2 w-12 h-12 rounded-xl items-center justify-center border-2 ${
                      selectedAvatar === i ? 'border-blue-500 bg-blue-500/20' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    <Text className="text-xl">{av}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selector de color */}
              <View className="flex-row flex-wrap gap-2">
                {AVATAR_COLORS.map((c, i) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(i)}
                    className={`w-9 h-9 rounded-full border-2 ${selectedColor === i ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={saveProfile}
                  disabled={saving || !editName.trim()}
                  className="flex-1 bg-blue-600 rounded-xl py-2.5 items-center"
                  style={{ opacity: (saving || !editName.trim()) ? 0.5 : 1 }}
                >
                  <Text className="text-white text-sm font-medium">{saving ? 'Guardando…' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingProfile(false)}
                  className="px-4 bg-slate-700 rounded-xl py-2.5"
                >
                  <Text className="text-slate-300 text-sm">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Sala activa ──────────────────────────────────────────────── */}
        {groupInfo && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Users size={15} color="#94a3b8" />
                <Text className="text-slate-400 text-xs uppercase tracking-wider">Sala</Text>
              </View>
              {isAdmin && (
                <View className="flex-row items-center gap-1">
                  <Crown size={12} color="#f59e0b" />
                  <Text className="text-amber-400 text-xs">Admin</Text>
                </View>
              )}
            </View>

            {/* Nombre del grupo */}
            <View className="mb-4">
              {!editingGroupName ? (
                <View className="flex-row items-center gap-3">
                  <Text className="text-white font-semibold text-lg flex-1">{groupInfo.name}</Text>
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => { setNewGroupName(groupInfo.name || ''); setEditingGroupName(true) }}
                      className="px-2 py-1 bg-slate-700 rounded-lg"
                    >
                      <Text className="text-slate-400 text-xs">Renombrar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                    maxLength={40}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={saveGroupName}
                    className="px-3 py-2 bg-blue-600 rounded-xl items-center justify-center"
                  >
                    <Save size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingGroupName(false)}
                    className="px-3 py-2 bg-slate-700 rounded-xl items-center justify-center"
                  >
                    <X size={14} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Código de invitación */}
            <View className="flex-row items-center gap-3 mb-4">
              <View className="flex-1 bg-slate-800 rounded-xl px-4 py-2.5 items-center">
                <Text className="text-xl font-mono font-bold text-white tracking-widest">
                  {groupInfo.code || '…'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={copyCode}
                className={`px-4 py-2.5 rounded-xl flex-row items-center gap-2 ${
                  copied
                    ? 'bg-emerald-600/20 border border-emerald-500/30'
                    : 'bg-slate-700'
                }`}
              >
                {copied
                  ? <><Check size={14} color="#34d399" /><Text className="text-emerald-400 text-sm font-medium">Copiado</Text></>
                  : <><Copy size={14} color="#94a3b8" /><Text className="text-slate-300 text-sm font-medium">Copiar</Text></>
                }
              </TouchableOpacity>
            </View>
            <Text className="text-slate-600 text-xs">Comparte este código para invitar a otros miembros.</Text>
          </View>
        )}

        {/* ── Miembros ─────────────────────────────────────────────────── */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">
            Miembros ({groupMembers.length})
          </Text>
          <View className="gap-2">
            {groupMembers.map(m => {
              const mAvatarIdx = parseInt(m.avatar?.replace('avatar', '') || '0', 10)
              const isMe     = m.id === uid
              const mIsAdmin = m.id === groupInfo?.createdBy
              return (
                <View key={m.id} className="flex-row items-center gap-3 p-2.5 rounded-xl bg-slate-800/40">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center shrink-0"
                    style={{ backgroundColor: (m.color || '#2563eb') + '33' }}
                  >
                    <Text className="text-lg">{AVATAR_EMOJIS[isNaN(mAvatarIdx) ? 0 : mAvatarIdx] || '😄'}</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-white text-sm font-medium" numberOfLines={1}>{m.name}</Text>
                      {isMe   && <Text className="text-blue-400 text-xs shrink-0">(tú)</Text>}
                      {mIsAdmin && <Crown size={11} color="#f59e0b" />}
                    </View>
                    <Text className="text-slate-500 text-xs" numberOfLines={1}>{m.email}</Text>
                  </View>
                  {isAdmin && !isMe && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(m.id, m.name)}
                      disabled={removingId === m.id || authLoading}
                      className="p-1.5 rounded-lg"
                      style={{ opacity: (removingId === m.id || authLoading) ? 0.4 : 1 }}
                    >
                      {removingId === m.id
                        ? <ActivityIndicator size="small" color="#64748b" />
                        : <Trash2 size={14} color="#64748b" />
                      }
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* ── Categorías ───────────────────────────────────────────────── */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Tag size={15} color="#94a3b8" />
              <Text className="text-slate-400 text-xs uppercase tracking-wider">Categorías</Text>
            </View>
            {!editingCats && (
              <TouchableOpacity
                onPress={openEditCats}
                className="px-3 py-1.5 bg-slate-700 rounded-lg"
              >
                <Text className="text-slate-300 text-xs">Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editingCats ? (
            <View className="flex-row flex-wrap gap-2">
              {categories.map(c => (
                <View key={c.id} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <Text className="text-sm">{c.icon}</Text>
                  <Text className="text-slate-300 text-sm">{c.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-2">
              {catList.map((c, i) => (
                <View key={c.id} className="flex-row items-center gap-2">
                  <TextInput
                    className="w-12 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-center text-white"
                    value={c.icon}
                    onChangeText={v => updateCat(i, 'icon', v)}
                    maxLength={4}
                    placeholder="🏠"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    value={c.label}
                    onChangeText={v => updateCat(i, 'label', v)}
                    maxLength={20}
                    placeholder="Nombre"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm text-center"
                    value={c.suggestedAmount?.toString() || '0'}
                    onChangeText={v => updateCat(i, 'suggestedAmount', parseFloat(v) || 0)}
                    keyboardType="decimal-pad"
                    placeholder="€"
                    placeholderTextColor="#64748b"
                  />
                  <TouchableOpacity
                    onPress={() => removeCat(i)}
                    disabled={catList.length <= 1}
                    className="p-2 rounded-lg"
                    style={{ opacity: catList.length <= 1 ? 0.3 : 1 }}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={addCat}
                className="py-2 rounded-lg border border-dashed border-slate-600 items-center flex-row justify-center gap-1.5"
              >
                <Plus size={14} color="#64748b" />
                <Text className="text-slate-400 text-sm">Añadir categoría</Text>
              </TouchableOpacity>

              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity
                  onPress={saveCats}
                  disabled={savingCats}
                  className="flex-1 bg-blue-600 rounded-xl py-2.5 items-center flex-row justify-center gap-2"
                  style={{ opacity: savingCats ? 0.5 : 1 }}
                >
                  {savingCats
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Save size={14} color="#fff" /><Text className="text-white text-sm font-medium ml-1">Guardar</Text></>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingCats(false)}
                  className="px-4 bg-slate-700 rounded-xl py-2.5"
                >
                  <Text className="text-slate-300 text-sm">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Apariencia ───────────────────────────────────────────────── */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Apariencia</Text>
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-2">
              <Moon size={16} color="#64748b" />
              <Text className="text-white text-sm">Modo oscuro</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#334155', true: '#2563eb' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Sala activa / Abandonar ───────────────────────────────────── */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Sala activa</Text>
          <TouchableOpacity
            onPress={handleSwitchRoom}
            className="flex-row items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl mb-2"
          >
            <ChevronRight size={16} color="#94a3b8" />
            <Text className="text-slate-300 text-sm">Cambiar de sala</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLeaveGroup}
            className="flex-row items-center gap-3 px-4 py-3 bg-red-500/10 rounded-xl"
          >
            <LogOut size={16} color="#f87171" />
            <Text className="text-red-400 text-sm">Abandonar esta sala</Text>
          </TouchableOpacity>
        </View>

        {/* ── Cerrar sesión ────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex-row items-center gap-3 mb-6"
        >
          <LogOut size={18} color="#94a3b8" />
          <Text className="text-slate-300 font-medium">Cerrar sesión</Text>
        </TouchableOpacity>

        <View className="items-center py-2">
          <Text className="text-slate-600 text-xs">Cuentas Compartidas v2.0</Text>
          <Text className="text-slate-700 text-xs mt-0.5">Hecho con 💙 · Firebase + React Native + Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
