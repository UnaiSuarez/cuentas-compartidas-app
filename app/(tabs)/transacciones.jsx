import { ScrollView, View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TrendingUp, TrendingDown, Landmark } from 'lucide-react-native'
import { useApp }        from '../../src/context/AppContext'
import { formatCurrency, formatDate } from '../../src/utils/formatters'

export default function TransaccionesScreen() {
  const { transactions, groupMembers, categories, loading } = useApp()

  const getMemberName = id => groupMembers.find(m => m.id === id)?.name || '?'
  const getCategoryLabel = id => categories.find(c => c.id === id)?.label || id

  const sorted = [...transactions].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? a.date?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? b.date?.toMillis?.() ?? 0
    return tb - ta
  })

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
        <Text className="text-white text-xl font-bold mb-4">Transacciones</Text>

        {sorted.length === 0 ? (
          <View className="items-center py-20">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-slate-400 text-center">Sin transacciones todavía.</Text>
            <Text className="text-slate-500 text-xs text-center mt-1">Añade gastos desde la app web.</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {sorted.map(tx => {
              const isIncome  = tx.type === 'income'
              const isCommon  = tx.paymentMode === 'common'
              const Icon      = isIncome ? TrendingUp : isCommon ? Landmark : TrendingDown
              const iconColor = isIncome ? '#10b981' : isCommon ? '#3b82f6' : '#ef4444'
              const amtColor  = isIncome ? '#10b981' : '#ef4444'
              const sign      = isIncome ? '+' : '-'

              return (
                <View
                  key={tx.id}
                  className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex-row items-center gap-3"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: iconColor + '22' }}
                  >
                    <Icon size={18} color={iconColor} />
                  </View>

                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-medium" numberOfLines={1}>
                      {tx.description || getCategoryLabel(tx.category?.id || tx.category)}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {isIncome
                        ? `${getMemberName(tx.paidBy)} · ${formatDate(tx.date)}`
                        : isCommon
                        ? `Gasto común · ${formatDate(tx.date)}`
                        : `${getMemberName(tx.paidBy)} pagó · ${formatDate(tx.date)}`
                      }
                    </Text>
                  </View>

                  <Text className="font-bold tabular-nums text-sm" style={{ color: amtColor }}>
                    {sign}{formatCurrency(tx.amount)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
