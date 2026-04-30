/**
 * Formulario de registro. Solo crea la cuenta Firebase Auth.
 * El perfil (nombre, avatar) y el grupo se configuran en los pasos siguientes.
 * AppContext detecta el nuevo usuario vía onAuthStateChanged y redirige automáticamente.
 */

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react-native'
import { useAuth } from '../../src/hooks/useAuth'

export default function SignUpScreen() {
  const router = useRouter()
  const { signUp, loading, error, setError } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [localErr, setLocalErr] = useState(null)

  async function handleSignUp() {
    setLocalErr(null)
    setError(null)
    if (password !== confirm) { setLocalErr('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setLocalErr('La contraseña debe tener al menos 6 caracteres.'); return }
    try {
      await signUp(email.trim(), password)
      // AppContext detectará el nuevo usuario vía onAuthStateChanged
      // y mostrará el paso PROFILE automáticamente
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
            <Text className="text-slate-400 text-sm mt-1">Paso 1 de 3 — Cuenta Firebase</Text>
          </View>

          {displayErr && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm text-center">{displayErr}</Text>
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
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
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

            {/* Confirmar contraseña */}
            <View>
              <Text className="text-slate-400 text-xs mb-1.5 ml-1">Confirmar contraseña</Text>
              <View className="relative">
                <TextInput
                  className="bg-slate-800 text-white rounded-xl px-4 py-3.5 border border-slate-700 pl-11"
                  placeholder="Repite la contraseña"
                  placeholderTextColor="#64748b"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPwd}
                />
                <View className="absolute left-3 top-0 bottom-0 justify-center">
                  <Lock size={16} color="#64748b" />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center flex-row justify-center gap-2 mt-2"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <UserPlus size={16} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">Crear cuenta</Text>
                  </>
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
