import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { scheduleLocalNotifications, cancelLocalNotifications } from '../utils/scheduleNotifications'

// Muestra la notificación aunque la app esté en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

/**
 * Inicializa notificaciones push y locales cuando el usuario tiene sesión.
 * userId = null → cancela notificaciones locales.
 */
export function useNotifications(userId) {
  const listenerRef = useRef(null)

  useEffect(() => {
    if (!userId) {
      cancelLocalNotifications()
      return
    }

    setup(userId)

    // Escucha notificaciones recibidas en primer plano (opcional: actualizar badge, etc.)
    listenerRef.current = Notifications.addNotificationReceivedListener(() => {})

    return () => {
      listenerRef.current?.remove()
    }
  }, [userId])
}

async function setup(userId) {
  try {
    // Canal de Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Cuentas Compartidas',
        importance: Notifications.AndroidImportance.MAX,
        sound:            'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#3b82f6',
      })
    }

    // Pedir permiso
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    // Token de Expo Push
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) return

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })

    // Guardar token en Firestore para que las Cloud Functions lo usen
    await updateDoc(doc(db, 'users', userId), { pushToken: token })

    // Programar recordatorios locales
    await scheduleLocalNotifications()
  } catch (e) {
    // No bloquear la app si las notificaciones fallan
    console.warn('[useNotifications] setup failed:', e.message)
  }
}
