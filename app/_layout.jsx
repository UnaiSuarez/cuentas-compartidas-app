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

    if (!firebaseUser || !userProfile?.name) {
      if (!inAuth) router.replace('/(auth)/sign-in')
    } else if (!groupId) {
      router.replace('/(auth)/room-selector')
    } else {
      if (inAuth) router.replace('/(tabs)/')
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
