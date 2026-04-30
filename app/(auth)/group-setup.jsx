import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

export default function GroupSetupScreen() {
  const { firebaseUser } = useApp()
  const { createGroup, joinGroup, loading, error, setError } = useAuth()

  const [tab,       setTab]       = useState('create')  // 'create' | 'join'
  const [groupName, setGroupName] = useState('')
  const [code,      setCode]      = useState('')

  async function handleCreate() {
    if (!groupName.trim()) return
    try {
      await createGroup(firebaseUser.uid, groupName.trim())
      // AppContext routing handles redirect
    } catch (_) {}
  }

  async function handleJoin() {
    if (code.trim().length < 6) return
    try {
      await joinGroup(firebaseUser.uid, code.trim())
    } catch (_) {}
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <View className="mb-8">
          <Text className="text-white text-2xl font-bold">Tu grupo</Text>
          <Text className="text-slate-400 text-sm mt-1">Crea uno nuevo o únete a uno existente</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-800 rounded-xl p-1 mb-6">
          {[['create','Crear'], ['join','Unirse']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => { setTab(key); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg items-center ${tab === key ? 'bg-blue-600' : ''}`}
            >
              <Text className={`font-medium text-sm ${tab === key ? 'text-white' : 'text-slate-400'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </View>
        )}

        {tab === 'create' ? (
          <View className="space-y-4">
            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Nombre del grupo</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700"
                placeholder="Piso de Madrid, Trip 2025…"
                placeholderTextColor="#64748b"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={40}
              />
            </View>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !groupName.trim()}
              className={`rounded-xl py-4 items-center ${groupName.trim() ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Crear grupo</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Código del grupo (6 caracteres)</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 text-center text-lg tracking-widest"
                placeholder="ABC123"
                placeholderTextColor="#64748b"
                value={code}
                onChangeText={v => setCode(v.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              onPress={handleJoin}
              disabled={loading || code.trim().length < 6}
              className={`rounded-xl py-4 items-center ${code.trim().length >= 6 ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Unirse al grupo</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
