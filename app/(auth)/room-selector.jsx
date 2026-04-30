import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Users, Plus, Hash, LogIn, Crown, ChevronRight, ArrowLeft } from 'lucide-react-native'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

export default function RoomSelectorScreen() {
  const router = useRouter()
  const { userProfile, userRooms, switchActiveGroup, loading } = useApp()
  const { createGroup, joinGroup, loading: authLoading, error, setError } = useAuth()

  const [panel,     setPanel]     = useState('list')   // 'list' | 'create' | 'join'
  const [groupName, setGroupName] = useState('')
  const [code,      setCode]      = useState('')

  function openPanel(p) { setPanel(p); setError(null); setGroupName(''); setCode('') }

  async function handleSelectRoom(id) {
    await switchActiveGroup(id)
    router.replace('/(tabs)/')
  }

  async function handleCreate() {
    if (!groupName.trim()) { setError('Escribe un nombre para la sala.'); return }
    try {
      await createGroup(userProfile?.id, groupName.trim())
      // AppContext routing handles redirect via _layout
    } catch (_) {}
  }

  async function handleJoin() {
    if (code.length !== 6) { setError('El código tiene exactamente 6 caracteres.'); return }
    try {
      await joinGroup(userProfile?.id, code.trim())
    } catch (_) {}
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="mt-8 mb-8 items-center">
          <Text className="text-4xl mb-2">🏠</Text>
          <Text className="text-white text-2xl font-bold">Mis Salas</Text>
          <Text className="text-slate-400 text-sm mt-1">
            Hola, {userProfile?.name} · Elige una sala
          </Text>
        </View>

        {/* Panel: Lista de salas */}
        {panel === 'list' && (
          <View>
            {userRooms.length === 0 ? (
              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center mb-4">
                <Text className="text-slate-400 text-sm mb-1 text-center">
                  Todavía no perteneces a ninguna sala.
                </Text>
                <Text className="text-slate-500 text-xs text-center">
                  Crea una nueva o únete con un código.
                </Text>
              </View>
            ) : (
              <View className="space-y-3 mb-4">
                {userRooms.map(room => (
                  <TouchableOpacity
                    key={room.id}
                    onPress={() => handleSelectRoom(room.id)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row items-center gap-4"
                  >
                    <View className="bg-blue-500/20 w-12 h-12 rounded-xl items-center justify-center">
                      <Text className="text-2xl">🏠</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold" numberOfLines={1}>{room.name}</Text>
                        {room.createdBy === userProfile?.id && (
                          <Crown size={12} color="#f59e0b" />
                        )}
                      </View>
                      <View className="flex-row items-center gap-3 mt-0.5">
                        <Text className="text-slate-500 text-xs">
                          <Users size={10} color="#64748b" /> {room.memberCount} miembro{room.memberCount !== 1 ? 's' : ''}
                        </Text>
                        <Text className="text-slate-600 text-xs font-mono">{room.code}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#64748b" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Botones de acción */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={() => openPanel('create')}
                className="flex-1 bg-blue-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
              >
                <Plus size={16} color="#fff" />
                <Text className="text-white text-sm font-medium">Crear sala</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openPanel('join')}
                className="flex-1 bg-slate-700 rounded-xl py-3 flex-row items-center justify-center gap-2"
              >
                <Hash size={16} color="#94a3b8" />
                <Text className="text-slate-300 text-sm font-medium">Unirse</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Panel: Crear sala */}
        {panel === 'create' && (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <TouchableOpacity
              onPress={() => openPanel('list')}
              className="flex-row items-center gap-1.5 mb-5"
            >
              <ArrowLeft size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-sm">Volver</Text>
            </TouchableOpacity>

            <Text className="text-white font-bold text-lg mb-4">Crear nueva sala</Text>

            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            )}

            <Text className="text-slate-400 text-xs mb-1.5 ml-1">Nombre de la sala</Text>
            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 mb-3"
              placeholder="Ej: Piso de Unai, Familia…"
              placeholderTextColor="#64748b"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={40}
            />

            <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
              <Text className="text-blue-300 text-sm">
                Se generará un código de 6 caracteres para invitar a tus compañeros.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={authLoading || !groupName.trim()}
              className="bg-blue-600 rounded-xl py-4 items-center flex-row justify-center gap-2"
              style={{ opacity: (authLoading || !groupName.trim()) ? 0.5 : 1 }}
            >
              {authLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Plus size={16} color="#fff" />
                    <Text className="text-white font-bold text-base ml-1">Crear sala</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Panel: Unirse */}
        {panel === 'join' && (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <TouchableOpacity
              onPress={() => openPanel('list')}
              className="flex-row items-center gap-1.5 mb-5"
            >
              <ArrowLeft size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-sm">Volver</Text>
            </TouchableOpacity>

            <Text className="text-white font-bold text-lg mb-4">Unirse a una sala</Text>

            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            )}

            <Text className="text-slate-400 text-xs mb-1.5 ml-1">Código de la sala</Text>
            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 text-center text-xl tracking-widest font-mono mb-4"
              placeholder="XXXXXX"
              placeholderTextColor="#64748b"
              value={code}
              onChangeText={v => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              onPress={handleJoin}
              disabled={authLoading || code.length !== 6}
              className="bg-emerald-600 rounded-xl py-4 items-center flex-row justify-center gap-2"
              style={{ opacity: (authLoading || code.length !== 6) ? 0.5 : 1 }}
            >
              {authLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <LogIn size={16} color="#fff" />
                    <Text className="text-white font-bold text-base ml-1">Unirme</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
