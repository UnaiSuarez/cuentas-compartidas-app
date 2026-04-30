import { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Plus, Search, X, TrendingUp, TrendingDown, Landmark,
  Pencil, Trash2, Users, Check, ChevronDown,
} from 'lucide-react-native'
import { useApp }          from '../../src/context/AppContext'
import { useTransactions } from '../../src/hooks/useTransactions'
import { useChat }         from '../../src/hooks/useChat'
import { useSettlement }   from '../../src/hooks/useSettlement'
import { formatCurrency, formatDate } from '../../src/utils/formatters'

// ─── Transaction Form ────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0]
const MODES = { EXPENSE: 'expense', INCOME: 'income', COMMON: 'common' }

function TransactionForm({ onClose, editData }) {
  const { userProfile, groupMembers, categories } = useApp()
  const { createTransaction, updateTransaction, submitting, error } = useTransactions()
  const { sendSystemMessage } = useChat()
  const { summary } = useSettlement()

  const myDebts = summary.pagosOptimos.filter(p => p.de === userProfile?.id)

  const [expenseType, setExpenseType] = useState(() =>
    editData?.paymentMode === 'external' ? 'external' : 'internal'
  )

  const [form, setForm] = useState(() => {
    if (editData) {
      const mode = editData.paymentMode === 'common'
        ? MODES.COMMON
        : editData.type === 'income'
        ? MODES.INCOME
        : MODES.EXPENSE
      return {
        mode,
        amount:      editData.amount?.toString() || '',
        category:    editData.category    || '',
        description: editData.description || '',
        paidBy:      editData.paidBy      || userProfile?.id || '',
        splitAmong:  editData.splitAmong  || groupMembers.map(m => m.id),
        date:        editData.date?.toDate
          ? editData.date.toDate().toISOString().split('T')[0]
          : today(),
      }
    }
    return {
      mode:        MODES.COMMON,
      amount:      '',
      category:    '',
      description: '',
      paidBy:      userProfile?.id || '',
      splitAmong:  groupMembers.map(m => m.id),
      date:        today(),
    }
  })

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function toggleParticipant(userId) {
    setForm(f => ({
      ...f,
      splitAmong: f.splitAmong.includes(userId)
        ? f.splitAmong.filter(id => id !== userId)
        : [...f.splitAmong, userId],
    }))
  }

  const isCommon   = form.mode === MODES.COMMON
  const isIncome   = form.mode === MODES.INCOME
  const isExpense  = form.mode === MODES.EXPENSE
  const isExternal = isExpense && expenseType === 'external'

  const parteEstimada = !isIncome && form.amount && form.splitAmong.length
    ? parseFloat(form.amount) / form.splitAmong.length
    : null

  async function handleSubmit() {
    const payload = {
      type:         isIncome ? 'income' : 'expense',
      paymentMode:  isCommon ? 'common' : isExternal ? 'external' : 'individual',
      amount:       parseFloat(form.amount),
      category:     form.category || 'other',
      description:  form.description.trim(),
      paidBy:       isCommon ? 'common' : form.paidBy,
      splitAmong:   isIncome ? [form.paidBy] : form.splitAmong,
      date:         new Date(form.date),
    }

    try {
      if (editData?.id) {
        await updateTransaction(editData.id, payload)
      } else {
        await createTransaction(payload)
        const catLabel = categories.find(c => c.id === form.category)?.label || ''
        let msg = ''
        if (isCommon) {
          msg = `🏦 Gasto común de ${formatCurrency(parseFloat(form.amount))}${catLabel ? ` en ${catLabel}` : ''}`
        } else if (isIncome) {
          const name = groupMembers.find(m => m.id === form.paidBy)?.name || 'Alguien'
          msg = `💰 ${name} añadió un ingreso de ${formatCurrency(parseFloat(form.amount))}${catLabel ? ` en ${catLabel}` : ''}`
        } else if (isExternal) {
          const name = groupMembers.find(m => m.id === form.paidBy)?.name || 'Alguien'
          msg = `💸 ${name} hizo un pago externo de ${formatCurrency(parseFloat(form.amount))}${catLabel ? ` en ${catLabel}` : ''}`
        } else {
          const name = groupMembers.find(m => m.id === form.paidBy)?.name || 'Alguien'
          msg = `💳 ${name} registró un gasto de ${formatCurrency(parseFloat(form.amount))}${catLabel ? ` en ${catLabel}` : ''}`
        }
        await sendSystemMessage(msg)
      }
      onClose?.()
    } catch (_) {}
  }

  const canSubmit = form.amount && !submitting &&
    (isCommon || !!form.paidBy) &&
    (isIncome || form.splitAmong.length > 0)

  return (
    <ScrollView
      className="flex-1 bg-slate-950 px-4"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-white font-semibold text-lg">
          {editData ? 'Editar' : 'Nueva'} transacción
        </Text>
        <TouchableOpacity onPress={onClose}>
          <X size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Selector de modo */}
      <View className="flex-row rounded-xl overflow-hidden border border-slate-700 mb-4">
        {[
          { key: MODES.COMMON,  label: 'Común',        Icon: Users,        active: isCommon,  activeStyle: 'bg-blue-500/20'    },
          { key: MODES.INCOME,  label: 'Ingreso',      Icon: TrendingUp,   active: isIncome,  activeStyle: 'bg-emerald-500/20' },
          { key: MODES.EXPENSE, label: 'Gasto Partido', Icon: TrendingDown, active: isExpense, activeStyle: 'bg-red-500/20'     },
        ].map(({ key, label, Icon, active, activeStyle }, idx) => (
          <TouchableOpacity
            key={key}
            onPress={() => set('mode', key)}
            className={`flex-1 py-2.5 items-center justify-center flex-row gap-1 ${active ? activeStyle : ''} ${idx === 1 ? 'border-x border-slate-700' : ''}`}
          >
            <Icon size={13} color={active ? (key === MODES.INCOME ? '#34d399' : key === MODES.COMMON ? '#60a5fa' : '#f87171') : '#94a3b8'} />
            <Text className={`text-xs font-medium ${active ? (key === MODES.INCOME ? 'text-emerald-400' : key === MODES.COMMON ? 'text-blue-400' : 'text-red-400') : 'text-slate-400'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isCommon && (
        <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
          <Text className="text-blue-300 text-xs">
            El gasto sale del fondo común. Nadie adelanta dinero individualmente; se divide entre los participantes.
          </Text>
        </View>
      )}

      {isExpense && (
        <View className="mb-4">
          <View className="flex-row rounded-xl overflow-hidden border border-slate-700">
            {[
              { key: 'internal', label: 'Interno' },
              { key: 'external', label: 'Externo' },
            ].map(({ key, label }, idx) => (
              <TouchableOpacity
                key={key}
                onPress={() => setExpenseType(key)}
                className={`flex-1 py-2 items-center ${
                  expenseType === key
                    ? key === 'external' ? 'bg-orange-500/20' : 'bg-slate-700'
                    : ''
                } ${idx === 1 ? 'border-l border-slate-700' : ''}`}
              >
                <Text className={`text-sm font-medium ${
                  expenseType === key
                    ? key === 'external' ? 'text-orange-400' : 'text-white'
                    : 'text-slate-400'
                }`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className={`text-xs mt-2 px-1 ${isExternal ? 'text-orange-300' : 'text-slate-500'}`}>
            {isExternal
              ? 'El pagador adelantó de su bolsillo. Los demás le reembolsan su parte sin tocar el fondo colectivo.'
              : 'El gasto sale del fondo colectivo. Los participantes asumen su parte.'
            }
          </Text>
        </View>
      )}

      {isIncome && myDebts.length > 0 && (
        <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
          <Text className="text-amber-300 text-xs font-medium mb-1">💡 Tienes deudas pendientes</Text>
          {myDebts.map((d, i) => {
            const creditorName = groupMembers.find(m => m.id === d.a)?.name || '?'
            return (
              <Text key={i} className="text-slate-300 text-xs">
                Al añadir <Text className="text-white font-semibold">{formatCurrency(d.monto)}</Text>,
                tu deuda con <Text className="text-emerald-400 font-medium">{creditorName}</Text> quedará saldada.
              </Text>
            )
          })}
        </View>
      )}

      {/* Monto */}
      <Text className="text-slate-400 text-xs mb-1">Monto (€)</Text>
      <TextInput
        className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 text-xl font-bold mb-4"
        placeholder="0,00"
        placeholderTextColor="#475569"
        value={form.amount}
        onChangeText={v => set('amount', v)}
        keyboardType="decimal-pad"
      />

      {/* Categoría */}
      <Text className="text-slate-400 text-xs mb-2">Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <TouchableOpacity
          onPress={() => set('category', '')}
          className={`mr-2 px-3 py-2 rounded-lg border ${!form.category ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}
        >
          <Text className={`text-sm ${!form.category ? 'text-blue-300' : 'text-slate-400'}`}>Sin categoría</Text>
        </TouchableOpacity>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            onPress={() => {
              set('category', c.id)
              if (c.suggestedAmount && !form.amount) set('amount', c.suggestedAmount.toString())
            }}
            className={`mr-2 px-3 py-2 rounded-lg border flex-row items-center gap-1 ${form.category === c.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}
          >
            <Text className="text-sm">{c.icon}</Text>
            <Text className={`text-sm ${form.category === c.id ? 'text-blue-300' : 'text-slate-400'}`}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Descripción */}
      <Text className="text-slate-400 text-xs mb-1">Descripción (opcional)</Text>
      <TextInput
        className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 mb-4"
        placeholder="¿En qué se gastó?"
        placeholderTextColor="#475569"
        value={form.description}
        onChangeText={v => set('description', v)}
        maxLength={200}
      />

      {/* Fecha */}
      <Text className="text-slate-400 text-xs mb-1">Fecha (YYYY-MM-DD)</Text>
      <TextInput
        className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 mb-4"
        placeholder="2025-01-31"
        placeholderTextColor="#475569"
        value={form.date}
        onChangeText={v => set('date', v)}
        maxLength={10}
      />

      {/* Pagado por */}
      {!isCommon && (
        <View className="mb-4">
          <Text className="text-slate-400 text-xs mb-2">
            {isIncome ? 'Aportado por' : 'Pagado por'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {groupMembers.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => set('paidBy', m.id)}
                className={`px-3 py-1.5 rounded-lg border ${
                  form.paidBy === m.id
                    ? 'bg-blue-600/30 border-blue-500/50'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <Text className={`text-sm font-medium ${form.paidBy === m.id ? 'text-blue-300' : 'text-slate-400'}`}>
                  {m.name}{m.id === userProfile?.id ? ' (tú)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Dividido entre */}
      {!isIncome && (
        <View className="mb-4">
          <Text className="text-slate-400 text-xs mb-2">Dividido entre</Text>
          <View className="flex-row flex-wrap gap-2">
            {groupMembers.map(m => (
              <TouchableOpacity
                key={m.id}
                onPress={() => toggleParticipant(m.id)}
                className={`px-3 py-1.5 rounded-lg border flex-row items-center gap-1 ${
                  form.splitAmong.includes(m.id)
                    ? 'bg-emerald-600/20 border-emerald-500/40'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                {form.splitAmong.includes(m.id) && <Check size={12} color="#34d399" />}
                <Text className={`text-sm font-medium ${form.splitAmong.includes(m.id) ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {parteEstimada && (
            <Text className="text-slate-400 text-xs mt-1.5">
              Cada persona: <Text className="text-white font-medium">{formatCurrency(parteEstimada)}</Text>
            </Text>
          )}
        </View>
      )}

      {error && (
        <View className="bg-red-500/10 rounded-lg py-2 px-3 mb-4">
          <Text className="text-red-400 text-sm text-center">{error}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!canSubmit}
        className="rounded-xl py-3.5 items-center flex-row justify-center gap-2"
        style={{
          backgroundColor: !canSubmit ? '#1e293b' : isIncome ? '#059669' : isCommon ? '#1d4ed8' : isExternal ? '#ea580c' : '#2563eb',
          opacity: !canSubmit ? 0.5 : 1,
        }}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <>
              <Plus size={18} color="#fff" />
              <Text className="text-white font-semibold text-base ml-1">
                {editData ? 'Guardar cambios' : 'Añadir'}
              </Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── Transaction List ─────────────────────────────────────────────────────────

export default function TransaccionesScreen() {
  const { transactions, groupMembers, loading } = useApp()
  const { deleteTransaction } = useTransactions()

  const [showForm,   setShowForm]   = useState(false)
  const [editData,   setEditData]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleting,   setDeleting]   = useState(null)

  const getMemberName = id => groupMembers.find(m => m.id === id)?.name || '—'

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          tx.description?.toLowerCase().includes(q) ||
          tx.categoryLabel?.toLowerCase().includes(q) ||
          getMemberName(tx.paidBy).toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [transactions, typeFilter, search, groupMembers])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? a.date?.toMillis?.() ?? 0
      const tb = b.createdAt?.toMillis?.() ?? b.date?.toMillis?.() ?? 0
      return tb - ta
    })
  }, [filtered])

  function openEdit(tx) { setEditData(tx); setShowForm(true) }
  function openNew()    { setEditData(null); setShowForm(true) }

  async function handleDelete(id) {
    Alert.alert(
      'Eliminar transacción',
      '¿Eliminar esta transacción? No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id)
            try { await deleteTransaction(id) }
            finally { setDeleting(null) }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  if (showForm) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <TransactionForm
          onClose={() => { setShowForm(false); setEditData(null) }}
          editData={editData}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
          <Text className="text-white text-xl font-bold">Transacciones</Text>
          <TouchableOpacity
            onPress={openNew}
            className="bg-blue-600 rounded-xl px-4 py-2 flex-row items-center gap-2"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-sm font-medium">Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Búsqueda */}
        <View className="px-4 mb-3 relative">
          <TextInput
            className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 pl-10"
            placeholder="Buscar por descripción, categoría o persona..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          <View className="absolute left-7 top-0 bottom-0 justify-center">
            <Search size={16} color="#64748b" />
          </View>
          {search && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              className="absolute right-7 top-0 bottom-0 justify-center"
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de tipo */}
        <View className="flex-row px-4 gap-2 mb-3">
          {[
            { value: 'all',     label: 'Todo'       },
            { value: 'expense', label: '📉 Gastos'  },
            { value: 'income',  label: '📈 Ingresos'},
          ].map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg border ${
                typeFilter === t.value
                  ? 'bg-blue-600/30 border-blue-500/40'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <Text className={`text-xs font-medium ${typeFilter === t.value ? 'text-blue-300' : 'text-slate-400'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-slate-500 text-xs px-4 mb-2">
          {sorted.length} resultado{sorted.length !== 1 ? 's' : ''}
        </Text>

        {/* Lista */}
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 20, gap: 8 }}
        >
          {sorted.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-slate-400 text-center">No hay transacciones que coincidan.</Text>
            </View>
          ) : (
            sorted.map(tx => {
              const isIncome   = tx.type === 'income'
              const isCommon   = tx.paidBy === 'common' || tx.paymentMode === 'common'
              const isExternal = tx.paymentMode === 'external'
              const txDate     = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)

              const iconColor = isCommon ? '#60a5fa' : isIncome ? '#34d399' : isExternal ? '#fb923c' : '#f87171'
              const amtColor  = isCommon ? '#60a5fa' : isIncome ? '#34d399' : isExternal ? '#fb923c' : '#f87171'
              const Icon      = isCommon ? Landmark : isIncome ? TrendingUp : TrendingDown

              return (
                <View
                  key={tx.id}
                  className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex-row items-center gap-3"
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                    style={{ backgroundColor: iconColor + '22' }}
                  >
                    <Icon size={18} color={iconColor} />
                  </View>

                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-medium" numberOfLines={1}>
                      {tx.description || tx.categoryLabel || (isIncome ? 'Ingreso' : isCommon ? 'Gasto común' : 'Gasto')}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                      {tx.categoryLabel && (
                        <Text className="text-slate-500 text-xs">{tx.categoryLabel}</Text>
                      )}
                      {isCommon
                        ? <Text className="text-xs text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">Fondo común</Text>
                        : isExternal
                        ? <Text className="text-xs text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded">Externo · {getMemberName(tx.paidBy)}</Text>
                        : <Text className="text-slate-500 text-xs">{getMemberName(tx.paidBy)}</Text>
                      }
                      <Text className="text-slate-600 text-xs">·</Text>
                      <Text className="text-slate-500 text-xs">{formatDate(txDate)}</Text>
                    </View>
                    {!isIncome && tx.splitAmong?.length > 0 && (
                      <Text className="text-slate-600 text-xs mt-0.5" numberOfLines={1}>
                        ÷ {tx.splitAmong.map(getMemberName).join(', ')}
                      </Text>
                    )}
                  </View>

                  <Text className="font-bold tabular-nums text-sm shrink-0" style={{ color: amtColor }}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>

                  <View className="flex-row gap-1 shrink-0">
                    <TouchableOpacity
                      onPress={() => openEdit(tx)}
                      className="p-1.5 rounded-lg"
                    >
                      <Pencil size={14} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(tx.id)}
                      disabled={deleting === tx.id}
                      className="p-1.5 rounded-lg"
                    >
                      {deleting === tx.id
                        ? <ActivityIndicator size="small" color="#f87171" />
                        : <Trash2 size={14} color="#64748b" />
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
