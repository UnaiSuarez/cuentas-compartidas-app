import * as Notifications from 'expo-notifications'

/**
 * Programa las notificaciones locales recurrentes.
 * Se llama una vez al iniciar sesión; no reprograma si ya existen.
 */
export async function scheduleLocalNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const existingIds = new Set(scheduled.map(n => n.identifier))

  // 1. Recordatorio semanal — lunes 9:00
  if (!existingIds.has('weekly-expenses')) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-expenses',
      content: {
        title: '🌵 ¿Vives gratis?',
        body: 'Llevas tiempo sin añadir nada al grupo. ¿Todo apuntado o simplemente lo olvidaste?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,   // 1 = domingo, 2 = lunes
        hour: 9,
        minute: 0,
      },
    })
  }

  // 2. Recordatorio fin de mes — cada ~28 días a las 20:00
  if (!existingIds.has('end-of-month')) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'end-of-month',
      content: {
        title: '📅 Fin de mes a la vista',
        body: '¿Has apuntado todos los gastos? No dejes que el mes se escape sin cuadrar.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 28 * 24 * 60 * 60,
        repeats: true,
      },
    })
  }

  // 3. Recordatorio de añadir dinero — cada ~30 días a las 10:00
  if (!existingIds.has('add-money')) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'add-money',
      content: {
        title: '💀 Nuevo mes, mismo drama',
        body: 'Tu avatar tiene hambre. ¿Has añadido fondos para este mes? No le abandones.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 30 * 24 * 60 * 60,
        repeats: true,
      },
    })
  }
}

export async function cancelLocalNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
