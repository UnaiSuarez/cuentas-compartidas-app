import { View, Text } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  LayoutDashboard, List, Scale, BarChart2, MessageCircle, Settings,
} from 'lucide-react-native'
import { useChat } from '../../src/hooks/useChat'

const ACTIVE   = '#3b82f6'
const INACTIVE = '#64748b'

function ChatTabIcon({ color, size }) {
  const { unreadCount } = useChat()
  return (
    <View>
      <MessageCircle size={size} color={color} />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: '#ef4444',
          borderRadius: 8, minWidth: 16, height: 16,
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  // En Android con navegación por gestos, insets.bottom puede ser 0.
  // Con botones (triángulo/cuadrado/círculo), puede ser 24-48 px.
  // Añadimos siempre un mínimo de 8 px de padding visible + el inset real.
  const bottomPad = insets.bottom + 8

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor:  '#1e293b',
          borderTopWidth:  1,
          paddingBottom:   bottomPad,
          height:          60 + insets.bottom,
        },
        tabBarActiveTintColor:   ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transacciones"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="liquidacion"
        options={{
          title: 'Saldar',
          tabBarIcon: ({ color, size }) => <Scale size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <ChatTabIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
