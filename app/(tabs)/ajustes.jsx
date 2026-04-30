import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LogOut, Users, Hash, Moon, ChevronRight } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useApp }  from '../../src/context/AppContext'
import { useAuth } from '../../src/hooks/useAuth'

export default function AjustesScreen() {
  const router = useRouter()
  const { userProfile, groupId, groupInfo, groupMembers, isAdmin, darkMode, toggleDarkMode, logout, clearActiveGroup } = useApp()
  const { leaveGroup, loading } = useAuth()

  function handleSwitchRoom() {
    clearActiveGroup()
    router.replace('/(auth)/room-selector')
  }

  function handleLeaveGroup() {
    Alert.alert(
      'Salir del grupo',
      `¿Seguro que quieres salir de "${groupInfo?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(userProfile.id, groupId)
              await clearActiveGroup()
              router.replace('/(auth)/room-selector')
            } catch (_) {}
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

  const AVATAR_EMOJIS = ['😄','🤖','👽','👻','🏴‍☠️','🥷','🧙','🚀','🧛','🔬','⚔️','🦄','😺','👨‍🍳','🦕','😇','🐻','🎧']
  const avatarIdx = parseInt(userProfile?.avatar?.replace('avatar','') || '0')

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-white text-xl font-bold mb-6">Ajustes</Text>

        {/* Perfil */}
        <View className="bg-slate-900 rounded-2xl p-5 border border-slate-800 mb-4 items-center">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: (userProfile?.color || '#3b82f6') + '33' }}
          >
            <Text className="text-3xl">{AVATAR_EMOJIS[avatarIdx] || '😄'}</Text>
          </View>
          <Text className="text-white text-lg font-bold">{userProfile?.name}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">{userProfile?.email}</Text>
        </View>

        {/* Grupo */}
        {groupInfo && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Grupo actual</Text>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Users size={16} color="#3b82f6" />
                <Text className="text-white font-medium">{groupInfo.name}</Text>
                {isAdmin && <Text className="text-amber-400 text-xs bg-amber-400/10 px-1.5 py-0.5 rounded">Admin</Text>}
              </View>
              <Text className="text-slate-400 text-sm">{groupMembers.length} miembros</Text>
            </View>

            <View className="flex-row items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 mb-3">
              <Hash size={14} color="#64748b" />
              <Text className="text-slate-400 text-sm">Código: </Text>
              <Text className="text-white font-mono font-bold tracking-widest">{groupInfo.code}</Text>
            </View>

            <TouchableOpacity
              onPress={handleSwitchRoom}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-blue-400 text-sm">Cambiar de sala</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Preferencias */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Preferencias</Text>
          <View className="flex-row items-center justify-between">
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

        {/* Acciones */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleLeaveGroup}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex-row items-center gap-3"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-400 font-medium">Salir del grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex-row items-center gap-3"
          >
            <LogOut size={18} color="#94a3b8" />
            <Text className="text-slate-300 font-medium">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
