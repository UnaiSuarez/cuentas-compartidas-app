/**
 * Paso 2 del onboarding: el usuario elige su nombre y avatar.
 * Se guarda directamente en Firestore /users/{uid}.
 */

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User, ChevronRight } from 'lucide-react-native'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

const AVATAR_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

const AVATARS = [
  '😄', '🤖', '👽', '👻', '🏴‍☠️', '🥷',
  '🧙', '🚀', '🧛', '🔬', '⚔️', '🦄',
  '😺', '👨‍🍳', '🦕', '😇', '🐻', '🎧',
]

export default function ProfileSetupScreen() {
  const { firebaseUser, updateUserProfile } = useApp()
  const { completeProfile, loading, error, setError } = useAuth()

  const [name,      setName]      = useState('')
  const [selected,  setSelected]  = useState(0)
  const [colorIdx,  setColorIdx]  = useState(0)

  const color = AVATAR_COLORS[colorIdx]

  async function handleSave() {
    if (!name.trim()) { setError('Escribe tu nombre.'); return }
    setError(null)
    try {
      const avatarKey = `avatar${selected}`
      await completeProfile(firebaseUser.uid, name.trim(), avatarKey, color)
      // Sincroniza el estado del contexto
      await updateUserProfile({ name: name.trim(), avatar: avatarKey, color })
    } catch (_) {}
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 mb-8">
          <Text className="text-white text-2xl font-bold">Tu perfil</Text>
          <Text className="text-slate-400 text-sm mt-1">Paso 2 de 3 — ¿Cómo te llamas y qué avatar eliges?</Text>
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* Preview del avatar seleccionado */}
        <View className="items-center mb-6">
          <View
            className="w-24 h-24 rounded-2xl items-center justify-center border-2 border-slate-700"
            style={{ backgroundColor: color + '33' }}
          >
            <Text className="text-5xl">{AVATARS[selected]}</Text>
          </View>
        </View>

        {/* Selector de avatares */}
        <Text className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Elige tu avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {AVATARS.map((av, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelected(i)}
              className={`mr-3 w-14 h-14 rounded-full items-center justify-center border-2 ${
                selected === i ? 'border-blue-400 bg-blue-400/20' : 'border-slate-700 bg-slate-800'
              }`}
            >
              <Text className="text-2xl">{av}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selector de color */}
        <Text className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Color de acento</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {AVATAR_COLORS.map((c, i) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColorIdx(i)}
              className={`w-10 h-10 rounded-full border-2 ${colorIdx === i ? 'border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>

        {/* Nombre */}
        <Text className="text-slate-400 text-xs mb-1.5 ml-1">Tu nombre</Text>
        <View className="relative mb-6">
          <TextInput
            className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 pl-11"
            placeholder="Ej: Unai, Nelly, Alex..."
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <View className="absolute left-3 top-0 bottom-0 justify-center">
            <User size={16} color="#64748b" />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !name.trim()}
          className="rounded-xl py-4 items-center flex-row justify-center gap-2"
          style={{ backgroundColor: name.trim() ? '#2563eb' : '#1e293b', opacity: loading ? 0.5 : 1 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text className="text-white font-bold text-base">Siguiente</Text>
                <ChevronRight size={16} color="#fff" />
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
