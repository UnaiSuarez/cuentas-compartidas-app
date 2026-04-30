/**
 * Hook de liquidaciones.
 *
 * El saldo de cada persona se calcula automáticamente:
 *   balance = ingresos aportados − parte en gastos
 *
 * Cuando un deudor añade un ingreso (TransactionForm), su saldo mejora
 * y los pagosOptimos se recalculan en tiempo real. No hay confirmación manual.
 */

import { useMemo } from 'react'
import { useApp }  from '../context/AppContext'
import { calculateGroupSummary } from '../utils/calculateSettlement'

export function useSettlement() {
  const { transactions, groupMembers } = useApp()

  const summary = useMemo(() => {
    if (!transactions.length && !groupMembers.length) return {
      totalIngresos:  0,
      totalGastos:    0,
      saldoColectivo: 0,
      balances:       {},
      pagosOptimos:   [],
    }

    const normalizedTx = transactions.map(tx => ({
      id:             tx.id,
      type:           tx.type,
      amount:         tx.amount,
      paidBy:         tx.paidBy,
      splitAmong:     tx.splitAmong,
      isSettlement:   tx.isSettlement,
    }))

    const normalizedUsers = groupMembers.map(m => ({ id: m.id }))
    return calculateGroupSummary(normalizedTx, normalizedUsers)
  }, [transactions, groupMembers])

  return { summary }
}
