import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowRight } from 'lucide-react-native'
import { useApp }        from '../../src/context/AppContext'
import { useSettlement } from '../../src/hooks/useSettlement'
import { formatCurrency } from '../../src/utils/formatters'

export default function LiquidacionScreen() {
  const { userProfile, groupMembers, loading } = useApp()
  const { summary } = useSettlement()

  const getMemberName = id => groupMembers.find(m => m.id === id)?.name || '?'

  const myDebts   = summary.pagosOptimos.filter(p => p.de === userProfile?.id)
  const myCredits = summary.pagosOptimos.filter(p => p.a  === userProfile?.id)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
        <Text className="text-white text-xl font-bold mb-4">Liquidación</Text>

        {/* Mis deudas */}
        {myDebts.length > 0 && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
            <Text className="text-red-300 text-sm font-semibold mb-2">⚠️ Tienes deudas pendientes</Text>
            {myDebts.map((p, i) => (
              <Text key={i} className="text-slate-300 text-sm mb-1">
                Debes <Text className="text-white font-bold">{formatCurrency(p.monto)}</Text>{' '}
                a <Text className="text-emerald-400 font-medium">{getMemberName(p.a)}</Text>
              </Text>
            ))}
            <Text className="text-slate-400 text-xs mt-2">
              Añade ese importe como ingreso en la web para saldarlo.
            </Text>
          </View>
        )}

        {/* Créditos */}
        {myCredits.length > 0 && (
          <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4">
            <Text className="text-emerald-300 text-sm font-semibold mb-2">💰 Te deben dinero</Text>
            {myCredits.map((p, i) => (
              <Text key={i} className="text-slate-300 text-sm mb-1">
                <Text className="text-amber-400 font-medium">{getMemberName(p.de)}</Text>{' '}
                te debe <Text className="text-white font-bold">{formatCurrency(p.monto)}</Text>
              </Text>
            ))}
          </View>
        )}

        {/* Saldos */}
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Saldo actual</Text>
          {groupMembers.map(member => {
            const bal = summary.balances[member.id] ?? 0
            const c   = bal > 0.01 ? '#10b981' : bal < -0.01 ? '#ef4444' : '#94a3b8'
            const icon = bal > 0.01 ? '✅' : bal < -0.01 ? '⚠️' : '🎉'
            const isMe = member.id === userProfile?.id
            return (
              <View
                key={member.id}
                className={`flex-row items-center justify-between py-3 px-3 rounded-xl mb-2 ${
                  isMe ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800/50'
                }`}
              >
                <View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-white font-semibold text-sm">{member.name}</Text>
                    {isMe && <Text className="text-blue-400 text-xs">(tú)</Text>}
                  </View>
                  <Text className="text-slate-500 text-xs mt-0.5">{icon} {
                    bal > 0.01 ? 'Le deben dinero' : bal < -0.01 ? 'Debe dinero' : 'En paz'
                  }</Text>
                </View>
                <Text className="text-lg font-bold tabular-nums" style={{ color: c }}>
                  {formatCurrency(bal, true)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Pagos óptimos */}
        {summary.pagosOptimos.length > 0 ? (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-1">Pagos a realizar</Text>
            <Text className="text-slate-500 text-xs mb-3">Añade el importe como ingreso para saldar.</Text>
            {summary.pagosOptimos.map((p, i) => {
              const isMe = userProfile?.id === p.de
              return (
                <View
                  key={`${p.de}-${p.a}`}
                  className={`flex-row items-center justify-between p-3 rounded-xl mb-2 ${
                    isMe ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/50'
                  }`}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-red-400 font-medium text-sm">{getMemberName(p.de)}</Text>
                    <ArrowRight size={14} color="#64748b" />
                    <Text className="text-emerald-400 font-medium text-sm">{getMemberName(p.a)}</Text>
                  </View>
                  <Text className="text-white font-bold text-sm">{formatCurrency(p.monto)}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <View className="bg-slate-900 rounded-2xl p-8 items-center border border-slate-800">
            <Text className="text-4xl mb-2">🎉</Text>
            <Text className="text-emerald-400 font-semibold">¡Sin deudas!</Text>
            <Text className="text-slate-400 text-sm mt-1">Todos los saldos están equilibrados.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
