import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Users, Plus, LogIn } from 'lucide-react-native'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

export default function RoomSelectorScreen() {
  const router = useRouter()
  const { userRooms, switchActiveGroup, loading } = useApp()
  const { loading: authLoading } = useAuth()

  async function handleSelectRoom(id) {
    await switchActiveGroup(id)
    router.replace('/(tabs)/')
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
        <View className="mt-8 mb-8">
          <Text className="text-white text-2xl font-bold">Tus grupos</Text>
          <Text className="text-slate-400 text-sm mt-1">Selecciona con cuál quieres trabajar</Text>
        </View>

        {userRooms.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">🏠</Text>
            <Text className="text-slate-400 text-center">No perteneces a ningún grupo todavía.</Text>
          </View>
        ) : (
          <View className="space-y-3 mb-6">
            {userRooms.map(room => (
              <TouchableOpacity
                key={room.id}
                onPress={() => handleSelectRoom(room.id)}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-blue-500/20 w-12 h-12 rounded-full items-center justify-center">
                    <Users size={22} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-white font-semibold text-base">{room.name}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {room.memberCount} miembro{room.memberCount !== 1 ? 's' : ''} · {room.code}
                    </Text>
                  </View>
                </View>
                <Text className="text-blue-400 text-xl">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Crear / Unirse */}
        <View className="border-t border-slate-800 pt-6 space-y-3">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/group-setup')}
            className="flex-row items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-xl p-4"
          >
            <Plus size={18} color="#3b82f6" />
            <Text className="text-blue-400 font-medium">Crear nuevo grupo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
