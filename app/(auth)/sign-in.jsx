import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/hooks/useAuth'

export default function SignInScreen() {
  const router = useRouter()
  const { login, loading, error } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    try {
      await login(email.trim(), password)
      // AppContext routing handles redirect
    } catch (_) {}
  }

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
          {/* Logo / Título */}
          <View className="items-center mb-10">
            <Text className="text-5xl mb-4">€</Text>
            <Text className="text-white text-3xl font-bold">Cuentas</Text>
            <Text className="text-blue-400 text-3xl font-bold">Compartidas</Text>
            <Text className="text-slate-400 text-sm mt-2">Gestiona gastos con tu grupo</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
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
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Contraseña</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mt-2"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Iniciar sesión</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-up')}
              className="items-center py-3"
            >
              <Text className="text-slate-400 text-sm">
                ¿No tienes cuenta?{' '}
                <Text className="text-blue-400 font-medium">Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
