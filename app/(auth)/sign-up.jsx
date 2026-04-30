import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/hooks/useAuth'

export default function SignUpScreen() {
  const router = useRouter()
  const { signUp, loading, error } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [localErr, setLocalErr] = useState(null)

  async function handleSignUp() {
    setLocalErr(null)
    if (password !== confirm) { setLocalErr('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setLocalErr('La contraseña debe tener al menos 6 caracteres.'); return }
    try {
      await signUp(email.trim(), password)
      router.replace('/(auth)/profile-setup')
    } catch (_) {}
  }

  const displayErr = localErr || error

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="mb-8">
            <Text className="text-white text-2xl font-bold">Crear cuenta</Text>
            <Text className="text-slate-400 text-sm mt-1">Únete a Cuentas Compartidas</Text>
          </View>

          <View className="space-y-4">
            {displayErr && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <Text className="text-red-400 text-sm text-center">{displayErr}</Text>
              </View>
            )}

            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Correo</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700"
                placeholder="tu@correo.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Contraseña</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Confirmar contraseña</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700"
                placeholder="Repite la contraseña"
                placeholderTextColor="#64748b"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mt-2"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Crear cuenta</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="items-center py-3"
            >
              <Text className="text-slate-400 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Text className="text-blue-400 font-medium">Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
