import { useMemo, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useApp }        from '../../src/context/AppContext'
import { formatCurrency } from '../../src/utils/formatters'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function EstadisticasScreen() {
  const { transactions, groupMembers, userProfile, loading } = useApp()
  const [view, setView] = useState('personal')  // 'personal' | 'group'

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  if (!transactions.length) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-3">📊</Text>
          <Text className="text-slate-400 text-center">Aún no hay datos suficientes para mostrar estadísticas.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <EstadisticasContent
        transactions={transactions}
        groupMembers={groupMembers}
        userProfile={userProfile}
        view={view}
        setView={setView}
      />
    </SafeAreaView>
  )
}

function EstadisticasContent({ transactions, groupMembers, userProfile, view, setView }) {
  const uid = userProfile?.id

  const filteredTx = useMemo(() => {
    if (view === 'group') return transactions
    if (!uid) return []
    return transactions.filter(tx => {
      if (tx.type === 'income') return tx.paidBy === uid
      return (tx.splitAmong || []).includes(uid) || tx.paidBy === uid
    })
  }, [transactions, view, uid])

  const byCategory = useMemo(() => {
    const map = {}
    filteredTx
      .filter(tx => tx.type === 'expense' && !tx.isSettlement)
      .forEach(tx => {
        const label = tx.categoryLabel || 'Otros'
        let amount = tx.amount
        if (view === 'personal' && uid) {
          const n = (tx.splitAmong || []).length || 1
          amount = (tx.splitAmong || []).includes(uid) ? tx.amount / n : 0
        }
        map[label] = (map[label] || 0) + amount
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
  }, [filteredTx, view, uid])

  const byMember = useMemo(() => {
    if (view === 'personal') return []
    return groupMembers.map(m => {
      const total = transactions
        .filter(tx => tx.type === 'expense' && !tx.isSettlement && tx.paidBy === m.id)
        .reduce((s, tx) => s + tx.amount, 0)
      return { name: m.name, total }
    })
  }, [transactions, groupMembers, view])

  const monthly = useMemo(() => {
    const months = {}
    filteredTx
      .filter(tx => tx.type === 'expense' && !tx.isSettlement)
      .forEach(tx => {
        const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
        const key = format(d, 'MMM yy', { locale: es })
        let amount = tx.amount
        if (view === 'personal' && uid) {
          const n = (tx.splitAmong || []).length || 1
          amount = (tx.splitAmong || []).includes(uid) ? tx.amount / n : 0
        }
        months[key] = (months[key] || 0) + amount
      })
    return Object.entries(months).map(([mes, total]) => ({ mes, total })).slice(-6)
  }, [filteredTx, view, uid])

  const totalGastos   = filteredTx.filter(tx => tx.type === 'expense' && !tx.isSettlement).reduce((s, tx) => s + tx.amount, 0)
  const totalIngresos = filteredTx.filter(tx => tx.type === 'income'  && !tx.isSettlement).reduce((s, tx) => s + tx.amount, 0)

  const myExpense = useMemo(() => {
    if (view !== 'personal' || !uid) return null
    return filteredTx
      .filter(tx => tx.type === 'expense' && !tx.isSettlement)
      .reduce((s, tx) => {
        const n = (tx.splitAmong || []).length || 1
        if ((tx.splitAmong || []).includes(uid)) return s + tx.amount / n
        return s
      }, 0)
  }, [filteredTx, view, uid])

  const maxCat = byCategory[0]?.value || 1
  const maxMonth = monthly.reduce((m, item) => Math.max(m, item.total), 0) || 1

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header con toggle */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-bold">Estadísticas</Text>
        <View className="flex-row bg-slate-800 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setView('personal')}
            className={`px-3 py-1.5 rounded-lg ${view === 'personal' ? 'bg-blue-600' : ''}`}
          >
            <Text className={`text-xs font-medium ${view === 'personal' ? 'text-white' : 'text-slate-400'}`}>
              Mis datos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setView('group')}
            className={`px-3 py-1.5 rounded-lg ${view === 'group' ? 'bg-blue-600' : ''}`}
          >
            <Text className={`text-xs font-medium ${view === 'group' ? 'text-white' : 'text-slate-400'}`}>
              Del grupo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Totales */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <Text className="text-slate-400 text-xs mb-1">
            {view === 'personal' ? 'Mi parte de gastos' : 'Total Gastos'}
          </Text>
          <Text className="text-red-400 text-2xl font-bold">
            {formatCurrency(view === 'personal' && myExpense !== null ? myExpense : totalGastos)}
          </Text>
          {view === 'personal' && myExpense !== null && totalGastos > (myExpense ?? 0) + 0.01 && (
            <Text className="text-slate-500 text-xs mt-1">
              Grupo: {formatCurrency(totalGastos)}
            </Text>
          )}
        </View>
        <View className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <Text className="text-slate-400 text-xs mb-1">
            {view === 'personal' ? 'Mis ingresos' : 'Total Ingresos'}
          </Text>
          <Text className="text-emerald-400 text-2xl font-bold">{formatCurrency(totalIngresos)}</Text>
        </View>
      </View>

      {/* Gastos por categoría — barras horizontales nativas */}
      {byCategory.length > 0 && (
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Por categoría</Text>
          {byCategory.map(({ name, value }, i) => (
            <View key={name} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <Text className="text-slate-300 text-sm">{name}</Text>
                </View>
                <Text className="text-white text-sm font-medium">{formatCurrency(value)}</Text>
              </View>
              <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${(value / maxCat) * 100}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Gastos por persona (sólo vista grupo) */}
      {view === 'group' && byMember.some(m => m.total > 0) && (
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Gastos pagados por persona</Text>
          {byMember
            .filter(m => m.total > 0)
            .sort((a, b) => b.total - a.total)
            .map((m, i) => {
              const maxMember = byMember.reduce((mx, item) => Math.max(mx, item.total), 0) || 1
              return (
                <View key={m.name} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-slate-300 text-sm">{m.name}</Text>
                    <Text className="text-white text-sm font-medium">{formatCurrency(m.total)}</Text>
                  </View>
                  <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${(m.total / maxMember) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </View>
                </View>
              )
            })}
        </View>
      )}

      {/* Evolución mensual */}
      {monthly.length > 1 && (
        <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-wider mb-4">Evolución mensual</Text>
          {monthly.map(({ mes, total }, i) => (
            <View key={mes} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-slate-300 text-sm capitalize">{mes}</Text>
                <Text className="text-white text-sm font-medium">{formatCurrency(total)}</Text>
              </View>
              <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(total / maxMonth) * 100}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}
