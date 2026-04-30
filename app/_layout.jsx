import { useEffect, useRef } from 'react'
import { View, Text, Animated, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppProvider, useApp } from '../src/context/AppContext'
import AppLogo from '../src/components/AppLogo'
import { useNotifications } from '../src/hooks/useNotifications'
import '../global.css'

function SplashScreen() {
  const fade  = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.75)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center' }}>
        <AppLogo size={90} />
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginTop: 20 }}>
          Cuentas
        </Text>
        <Text style={{ color: '#3b82f6', fontSize: 28, fontWeight: 'bold' }}>
          Compartidas
        </Text>
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 32 }} />
      </Animated.View>
    </View>
  )
}

function RootLayoutNav() {
  const { firebaseUser, userProfile, groupId, loading } = useApp()
  const segments = useSegments()
  const router   = useRouter()

  // Inicializar notificaciones cuando hay sesión activa
  useNotifications(firebaseUser?.uid ?? null)

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'

    if (!firebaseUser) {
      if (!inAuth || segments[1] === 'room-selector') {
        router.replace('/(auth)/sign-in')
      }
      return
    }

    if (!userProfile?.name) {
      const cur = segments[1]
      if (cur !== 'profile-setup' && cur !== 'group-setup') {
        router.replace('/(auth)/profile-setup')
      }
      return
    }

    if (!groupId) {
      if (!inAuth || (segments[1] !== 'room-selector' && segments[1] !== 'group-setup')) {
        router.replace('/(auth)/room-selector')
      }
      return
    }

    if (inAuth) router.replace('/(tabs)/')
  }, [firebaseUser, userProfile, groupId, loading])

  if (loading) return <SplashScreen />

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  )
}
