import { ScrollView, View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react-native'
import { useApp }        from '../../src/context/AppContext'
import { useSettlement } from '../../src/hooks/useSettlement'
import { formatCurrency } from '../../src/utils/formatters'

export default function DashboardScreen() {
  const { userProfile, groupMembers, groupInfo, loading } = useApp()
  const { summary } = useSettlement()

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  const myBalance  = userProfile ? (summary.balances[userProfile.id] ?? 0) : 0
  const pendingFrom = summary.pagosOptimos.filter(p => p.a === userProfile?.id)
  const myPending   = pendingFrom.reduce((s, p) => s + p.monto, 0)
  const myAvailable = myBalance - myPending

  const getMemberName = id => groupMembers.find(m => m.id === id)?.name || '?'

  const balColor = myAvailable > 0.01 ? '#10b981' : myAvailable < -0.01 ? '#ef4444' : '#94a3b8'

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Header */}
        <View className="mb-5 pt-2">
          <Text className="text-slate-400 text-xs uppercase tracking-wider">Sala activa</Text>
          <Text className="text-white text-xl font-bold">{groupInfo?.name || '—'}</Text>
        </View>

        {/* Mi saldo */}
        {userProfile && (
          <View className="bg-slate-900 rounded-2xl p-6 mb-4 items-center border border-slate-800">
            <Text className="text-slate-400 text-sm mb-2">Tu saldo, {userProfile.name}</Text>
            <Text className="text-5xl font-bold tabular-nums" style={{ color: balColor }}>
              {formatCurrency(myAvailable, true)}
            </Text>
            {pendingFrom.length > 0 && (
              <View className="mt-3 w-full gap-1">
                {pendingFrom.map((p, i) => (
                  <Text key={i} className="text-amber-400 text-xs text-center">
                    +{formatCurrency(p.monto)} pendiente de {getMemberName(p.de)}
                  </Text>
                ))}
              </View>
            )}
            <Text className="text-slate-500 text-xs mt-2">
              {myAvailable > 0.01 ? 'Saldo disponible ✅'
               : myAvailable < -0.01 ? 'Necesitas aportar fondos ⚠️'
               : myPending > 0.01 ? 'Pendiente de cobro ⏳'
               : 'Estás en paz 🎉'}
            </Text>
          </View>
        )}

        {/* Cards resumen */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">Total ingresos</Text>
              <TrendingUp size={14} color="#10b981" />
            </View>
            <Text className="text-emerald-400 text-lg font-bold">{formatCurrency(summary.totalIngresos)}</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">Total gastos</Text>
              <TrendingDown size={14} color="#ef4444" />
            </View>
            <Text className="text-red-400 text-lg font-bold">{formatCurrency(summary.totalGastos)}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">Saldo colectivo</Text>
              <Wallet size={14} color={summary.saldoColectivo >= 0 ? '#10b981' : '#ef4444'} />
            </View>
            <Text
              className="text-lg font-bold"
              style={{ color: summary.saldoColectivo >= 0 ? '#10b981' : '#ef4444' }}
            >
              {formatCurrency(summary.saldoColectivo)}
            </Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">Miembros</Text>
              <Users size={14} color="#3b82f6" />
            </View>
            <Text className="text-white text-lg font-bold">{groupMembers.length}</Text>
          </View>
        </View>

        {/* Saldos por persona */}
        {groupMembers.length > 0 && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Saldo por persona</Text>
            {groupMembers.map(member => {
              const bal = summary.balances[member.id] ?? 0
              const c = bal > 0.01 ? '#10b981' : bal < -0.01 ? '#ef4444' : '#94a3b8'
              return (
                <View key={member.id} className="flex-row items-center justify-between py-2.5 border-b border-slate-800" style={{ borderBottomWidth: member === groupMembers[groupMembers.length-1] ? 0 : 1 }}>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: (member.color || '#3b82f6') + '33' }}
                    >
                      <Text className="text-xs font-bold" style={{ color: member.color || '#3b82f6' }}>
                        {member.name[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-white text-sm font-medium">{member.name}</Text>
                    {member.id === userProfile?.id && (
                      <Text className="text-blue-400 text-xs">(tú)</Text>
                    )}
                  </View>
                  <Text className="text-base font-bold tabular-nums" style={{ color: c }}>
                    {formatCurrency(bal, true)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Pagos del grupo */}
        {summary.pagosOptimos.length > 0 && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-3">Pagos a realizar</Text>
            {summary.pagosOptimos.map((p, i) => (
              <View
                key={`${p.de}-${p.a}`}
                className={`flex-row items-center justify-between py-3 ${i < summary.pagosOptimos.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <Text className="text-red-400 text-sm font-medium flex-1">{getMemberName(p.de)}</Text>
                <View className="items-center mx-3">
                  <Text className="text-slate-500 text-xs">→</Text>
                  <Text className="text-white font-bold text-xs">{formatCurrency(p.monto)}</Text>
                </View>
                <Text className="text-emerald-400 text-sm font-medium flex-1 text-right">{getMemberName(p.a)}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}
