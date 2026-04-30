import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppProvider, useApp } from '../src/context/AppContext'
import '../global.css'

function RootLayoutNav() {
  const { firebaseUser, userProfile, groupId, loading } = useApp()
  const segments = useSegments()
  const router   = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'
    const inTabs = segments[0] === '(tabs)'

    if (!firebaseUser) {
      // No hay usuario autenticado → ir al login
      if (!inAuth || segments[1] === 'room-selector') {
        router.replace('/(auth)/sign-in')
      }
      return
    }

    // Hay usuario Firebase pero no tiene perfil completo (nombre vacío) → setup
    if (!userProfile?.name) {
      const currentRoute = segments[1]
      if (currentRoute !== 'profile-setup' && currentRoute !== 'group-setup') {
        router.replace('/(auth)/profile-setup')
      }
      return
    }

    // Tiene perfil pero no sala activa → selector de salas
    if (!groupId) {
      if (!inAuth || segments[1] !== 'room-selector' && segments[1] !== 'group-setup') {
        router.replace('/(auth)/room-selector')
      }
      return
    }

    // Todo completo → ir a las tabs
    if (inAuth) {
      router.replace('/(tabs)/')
    }
  }, [firebaseUser, userProfile, groupId, loading])

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
