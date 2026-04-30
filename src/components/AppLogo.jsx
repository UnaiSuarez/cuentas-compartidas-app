import { View, Text } from 'react-native'

/**
 * Logo de la app — dos semiarcos azul/esmeralda con moneda central.
 * Replica el SVG de la web usando solo primitivas de React Native.
 */
export default function AppLogo({ size = 80 }) {
  const stroke  = Math.round(size * 0.078)
  const inner   = Math.round(size * 0.37)
  const fontSize = Math.round(size * 0.26)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Semiarco superior — azul */}
      <View style={{ position: 'absolute', top: 0, width: size, height: size / 2, overflow: 'hidden' }}>
        <View style={{
          width: size, height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
        }} />
      </View>

      {/* Semiarco inferior — esmeralda */}
      <View style={{ position: 'absolute', bottom: 0, width: size, height: size / 2, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <View style={{
          position: 'absolute', bottom: 0,
          width: size, height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
        }} />
      </View>

      {/* Moneda central */}
      <View style={{
        width: inner * 2, height: inner * 2,
        borderRadius: inner,
        backgroundColor: '#0f172a',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#e2e8f0', fontSize, fontWeight: 'bold', lineHeight: fontSize * 1.3 }}>
          €
        </Text>
      </View>
    </View>
  )
}
