import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native'
import { useAuth } from '../../src/hooks/useAuth'
import AppLogo from '../../src/components/AppLogo'

export default function SignInScreen() {
  const router = useRouter()
  const { login, resetPassword, loading, error, setError } = useAuth()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin() {
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (_) {}
  }

  async function handleReset() {
    if (!email.trim()) { setError('Escribe tu correo primero.'); return }
    setError(null)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
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
            <AppLogo size={72} />
            <Text className="text-white text-3xl font-bold mt-5">Cuentas</Text>
            <Text className="text-blue-400 text-3xl font-bold">Compartidas</Text>
            <Text className="text-slate-400 text-sm mt-2">Gestiona gastos con tu grupo</Text>
          </View>

          {/* Mensajes de estado */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          )}

          {resetSent && (
            <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
              <Text className="text-emerald-400 text-sm text-center">
                ✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.
              </Text>
            </View>
          )}

          <View className="space-y-4">
            {/* Email */}
            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Correo electrónico</Text>
              <View className="relative">
                <TextInput
                  className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 pl-11"
                  placeholder="tu@correo.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <View className="absolute left-3 top-0 bottom-0 justify-center">
                  <Mail size={16} color="#64748b" />
                </View>
              </View>
            </View>

            {/* Contraseña */}
            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Contraseña</Text>
              <View className="relative">
                <TextInput
                  className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 pl-11 pr-11"
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  autoComplete="password"
                />
                <View className="absolute left-3 top-0 bottom-0 justify-center">
                  <Lock size={16} color="#64748b" />
                </View>
                <TouchableOpacity
                  onPress={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-0 bottom-0 justify-center"
                >
                  {showPwd
                    ? <EyeOff size={16} color="#64748b" />
                    : <Eye size={16} color="#64748b" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center flex-row justify-center gap-2 mt-2"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <LogIn size={16} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">Iniciar sesión</Text>
                  </>
              }
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mt-2">
              <TouchableOpacity onPress={handleReset}>
                <Text className="text-slate-500 text-sm">¿Olvidaste la contraseña?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text className="text-blue-400 font-medium text-sm">Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
