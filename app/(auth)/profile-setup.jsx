import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']
const AVATARS = ['😄','🤖','👽','👻','🏴‍☠️','🥷','🧙','🚀','🧛','🔬','⚔️','🦄','😺','👨‍🍳','🦕','😇','🐻','🎧']

export default function ProfileSetupScreen() {
  const router = useRouter()
  const { firebaseUser } = useApp()
  const { completeProfile, loading, error } = useAuth()

  const [name,   setName]   = useState('')
  const [avatar, setAvatar] = useState(0)
  const [color,  setColor]  = useState(COLORS[0])

  async function handleSave() {
    if (!name.trim()) return
    try {
      await completeProfile(firebaseUser.uid, name.trim(), `avatar${avatar}`, color)
      router.replace('/(auth)/group-setup')
    } catch (_) {}
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 mb-8">
          <Text className="text-white text-2xl font-bold">Tu perfil</Text>
          <Text className="text-slate-400 text-sm mt-1">Elige cómo aparecerás en el grupo</Text>
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* Avatar */}
        <Text className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Elige tu avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {AVATARS.map((av, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setAvatar(i)}
              className={`mr-3 w-14 h-14 rounded-full items-center justify-center border-2 ${
                avatar === i ? 'border-blue-400 bg-blue-400/20' : 'border-slate-700 bg-slate-800'
              }`}
            >
              <Text className="text-2xl">{av}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Color */}
        <Text className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Color de acento</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              className={`w-10 h-10 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>

        {/* Nombre */}
        <Text className="text-slate-400 text-xs mb-1.5 ml-1">Tu nombre</Text>
        <TextInput
          className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 mb-6"
          placeholder="¿Cómo te llamas?"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
          maxLength={20}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !name.trim()}
          className={`rounded-xl py-4 items-center ${name.trim() ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Continuar</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
