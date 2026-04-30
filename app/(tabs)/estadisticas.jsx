import { ScrollView, View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp }        from '../../src/context/AppContext'
import { useSettlement } from '../../src/hooks/useSettlement'
import { formatCurrency } from '../../src/utils/formatters'

export default function EstadisticasScreen() {
  const { transactions, groupMembers, categories, userProfile, loading } = useApp()
  const { summary } = useSettlement()

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  const gastos   = transactions.filter(t => t.type === 'expense')
  const ingresos = transactions.filter(t => t.type === 'income')

  // Gastos por categoría
  const byCategory = {}
  gastos.forEach(t => {
    const key = t.category?.label || t.category?.id || 'Otros'
    byCategory[key] = (byCategory[key] || 0) + t.amount
  })
  const catList = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const maxCat = catList[0]?.[1] || 1

  // Aportaciones por miembro
  const byMember = {}
  ingresos.forEach(t => {
    const name = groupMembers.find(m => m.id === t.paidBy)?.name || '?'
    byMember[name] = (byMember[name] || 0) + t.amount
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
        <Text className="text-white text-xl font-bold mb-4">Estadísticas</Text>

        {/* Resumen general */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Transacciones</Text>
            <Text className="text-white text-2xl font-bold">{transactions.length}</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Gasto medio</Text>
            <Text className="text-white text-2xl font-bold">
              {gastos.length > 0 ? formatCurrency(summary.totalGastos / gastos.length) : '—'}
            </Text>
          </View>
        </View>

        {/* Gastos por categoría */}
        {catList.length > 0 && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Gastos por categoría</Text>
            {catList.map(([cat, amount]) => (
              <View key={cat} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white text-sm">{cat}</Text>
                  <Text className="text-slate-300 text-sm font-medium">{formatCurrency(amount)}</Text>
                </View>
                <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(amount / maxCat) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Aportaciones por miembro */}
        {Object.keys(byMember).length > 0 && (
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Aportaciones</Text>
            {Object.entries(byMember)
              .sort((a, b) => b[1] - a[1])
              .map(([name, amount]) => (
                <View key={name} className="flex-row items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                  <Text className="text-white text-sm">{name}</Text>
                  <Text className="text-emerald-400 font-bold text-sm">{formatCurrency(amount)}</Text>
                </View>
              ))
            }
          </View>
        )}

        {transactions.length === 0 && (
          <View className="items-center py-20">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-slate-400 text-center">Sin datos todavía.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
