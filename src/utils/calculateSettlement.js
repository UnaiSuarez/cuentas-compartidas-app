/**
 * Motor de cálculo de saldos y settlement.
 *
 * Modelo financiero:
 *   balance[uid] = Σ ingresos aportados  −  Σ partes en gastos
 *
 *   - Los ingresos son la única forma de aumentar el saldo.
 *   - Los gastos (individual o común) siempre debitan a los participantes.
 *   - El campo paidBy en gastos individuales es informativo (quién pagó
 *     físicamente) pero NO añade crédito al pagador.
 *   - Σ balance[uid] = saldoColectivo = totalIngresos − totalGastos (siempre).
 */

export function calculateBalances(transactions, users) {
  const balances = {}
  users.forEach(u => { balances[u.id] = 0 })

  transactions.forEach(tx => {
    const tipo           = tx.type       || tx.tipo
    const monto          = tx.amount     || tx.monto
    const pagado_por     = tx.paidBy     || tx.pagado_por
    const dividido_entre = tx.splitAmong || tx.dividido_entre

    if (tipo === 'income' || tipo === 'ingreso') {
      if (balances[pagado_por] !== undefined) balances[pagado_por] += monto
      return
    }

    const participantes = dividido_entre || []
    if (participantes.length === 0) return
    const partePorPersona = monto / participantes.length

    // Todos los gastos (individual o común) debitan solo a los participantes.
    // paidBy es informativo; no genera crédito para el pagador.
    participantes.forEach(uid => {
      if (balances[uid] !== undefined) balances[uid] -= partePorPersona
    })
  })

  return balances
}

export function calculateOptimalPayments(balances) {
  const EPSILON   = 0.01
  const creditors = []
  const debtors   = []

  Object.entries(balances).forEach(([userId, saldo]) => {
    if (saldo > EPSILON)  creditors.push({ userId, amount:  saldo })
    if (saldo < -EPSILON) debtors.push(  { userId, amount: -saldo })
  })

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const payments = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor   = debtors[j]
    const amount   = Math.min(creditor.amount, debtor.amount)

    payments.push({ de: debtor.userId, a: creditor.userId, monto: parseFloat(amount.toFixed(2)) })

    creditor.amount -= amount
    debtor.amount   -= amount
    if (creditor.amount < EPSILON) i++
    if (debtor.amount   < EPSILON) j++
  }

  return payments
}

export function calculateGroupSummary(transactions, users) {
  let totalIngresos = 0
  let totalGastos   = 0

  transactions.forEach(tx => {
    const tipo  = tx.type   || tx.tipo
    const monto = tx.amount || tx.monto
    if (tipo === 'income' || tipo === 'ingreso') totalIngresos += monto
    else                                          totalGastos   += monto
  })

  const balances     = calculateBalances(transactions, users)
  const pagosOptimos = calculateOptimalPayments(balances)

  // saldoColectivo = dinero real en el fondo = ingresos − todos los gastos
  const saldoColectivo = totalIngresos - totalGastos

  return {
    totalIngresos,
    totalGastos,
    saldoColectivo,
    balances,
    pagosOptimos,
  }
}

/**
 * Desglosa el saldo de cada usuario:
 *   balance = contributed − expenseShare
 *
 * Incluye paidAsProxy: el importe que cada persona pagó físicamente
 * por cuenta del fondo (informativo, no afecta al balance).
 */
export function calculateBalanceBreakdown(transactions, users) {
  const data = {}
  users.forEach(u => {
    data[u.id] = { contributed: 0, expenseShare: 0, paidAsProxy: 0 }
  })

  let poolBalance = 0

  transactions.filter(tx => !tx.isSettlement).forEach(tx => {
    const paidBy       = tx.paidBy || tx.pagado_por
    const participants = tx.splitAmong || tx.dividido_entre || []
    const n            = participants.length || 1
    const share        = tx.amount / n

    if (tx.type === 'income' || tx.tipo === 'ingreso') {
      if (data[paidBy]) {
        data[paidBy].contributed += tx.amount
        poolBalance += tx.amount
      }
    } else {
      poolBalance -= tx.amount
      if (paidBy && paidBy !== 'common' && data[paidBy]) {
        data[paidBy].paidAsProxy += tx.amount
      }
      participants.forEach(pid => {
        if (data[pid]) data[pid].expenseShare += share
      })
    }
  })

  const userBreakdowns = {}
  Object.entries(data).forEach(([uid, b]) => {
    userBreakdowns[uid] = {
      ...b,
      balance: b.contributed - b.expenseShare,
    }
  })

  return { userBreakdowns, poolBalance }
}
