/**
 * Calculates net balance for every member in a trip.
 * 
 * net[memberId] > 0 means the member is owed money (Creditor)
 * net[memberId] < 0 means the member owes money (Debtor)
 * net[memberId] === 0 means the member is even
 */
export function calculateBalances(members, expenses, settlements = []) {
  const balances = {};
  const totalPaidByMember = {};
  const totalSpentForMember = {};

  // Initialize all members
  members.forEach(m => {
    balances[m.id] = 0;
    totalPaidByMember[m.id] = 0;
    totalSpentForMember[m.id] = 0;
  });

  // Process regular expenses
  expenses.forEach(expense => {
    // 1. Process Payers (Who put up the cash)
    if (expense.payers && Array.isArray(expense.payers)) {
      expense.payers.forEach(payer => {
        const amt = parseFloat(payer.amount) || 0;
        if (balances[payer.memberId] !== undefined) {
          balances[payer.memberId] += amt;
          totalPaidByMember[payer.memberId] += amt;
        }
      });
    } else if (expense.paidById) {
      // Single payer shorthand
      const amt = parseFloat(expense.amount) || 0;
      if (balances[expense.paidById] !== undefined) {
        balances[expense.paidById] += amt;
        totalPaidByMember[expense.paidById] += amt;
      }
    }

    // 2. Process Splits (Who consumed / is responsible for what portion)
    if (expense.splits && Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const amt = parseFloat(split.amount) || 0;
        if (balances[split.memberId] !== undefined) {
          balances[split.memberId] -= amt;
          totalSpentForMember[split.memberId] += amt;
        }
      });
    }
  });

  // Process manual settlements (A paid B directly to settle up)
  settlements.forEach(settlement => {
    const amt = parseFloat(settlement.amount) || 0;
    if (balances[settlement.fromId] !== undefined) {
      balances[settlement.fromId] += amt;
    }
    if (balances[settlement.toId] !== undefined) {
      balances[settlement.toId] -= amt;
    }
  });

  // Clean floating point inaccuracies (e.g. 0.0000000001)
  Object.keys(balances).forEach(id => {
    balances[id] = Math.round(balances[id] * 100) / 100;
    totalPaidByMember[id] = Math.round(totalPaidByMember[id] * 100) / 100;
    totalSpentForMember[id] = Math.round(totalSpentForMember[id] * 100) / 100;
  });

  return { balances, totalPaidByMember, totalSpentForMember };
}

/**
 * Direct Pairwise Neutralization (Bilateral Netting)
 * 
 * Tracks who actually paid for whom across every bill.
 * Then for any two friends A and B:
 * - A owes B: X
 * - B owes A: Y
 * - If Y > X, B pays A (Y - X).
 * - If X > Y, A pays B (X - Y).
 * 
 * Nobody is asked to pay a 3rd party they never transacted with!
 */
export function calculateDirectPairwiseDebts(members, expenses, settlements = []) {
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  // pairwiseMatrix[debtorId][creditorId] = amount owed
  const matrix = {};
  members.forEach(m1 => {
    matrix[m1.id] = {};
    members.forEach(m2 => {
      matrix[m1.id][m2.id] = 0;
    });
  });

  // 1. Accumulate raw pairwise debts from expenses
  expenses.forEach(expense => {
    const totalAmount = parseFloat(expense.amount) || 0;
    if (totalAmount <= 0) return;

    // Resolve payers with their respective contribution share (fraction)
    let payersList = [];
    if (expense.payers && Array.isArray(expense.payers) && expense.payers.length > 0) {
      payersList = expense.payers.map(p => ({
        memberId: p.memberId,
        amount: parseFloat(p.amount) || 0,
        fraction: (parseFloat(p.amount) || 0) / totalAmount
      }));
    } else if (expense.paidById) {
      payersList = [{
        memberId: expense.paidById,
        amount: totalAmount,
        fraction: 1.0
      }];
    }

    // Allocate each split to the payer(s)
    if (expense.splits && Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const splitAmount = parseFloat(split.amount) || 0;
        const debtorId = split.memberId;

        payersList.forEach(payer => {
          const creditorId = payer.memberId;
          // If debtor is not the creditor, record the debt
          if (debtorId !== creditorId && matrix[debtorId] && matrix[debtorId][creditorId] !== undefined) {
            const owedToPayer = splitAmount * payer.fraction;
            matrix[debtorId][creditorId] += owedToPayer;
          }
        });
      });
    }
  });

  // 2. Apply recorded settlements
  settlements.forEach(s => {
    const fromId = s.fromId;
    const toId = s.toId;
    const amt = parseFloat(s.amount) || 0;

    // A paid B, so A's debt to B decreases
    if (matrix[fromId] && matrix[fromId][toId] !== undefined) {
      matrix[fromId][toId] -= amt;
    }
  });

  // 3. Neutralize debts between every pair (A, B)
  const transactions = [];
  const processedPairs = new Set();

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const idA = members[i].id;
      const idB = members[j].id;

      const owedAtoB = Math.round((matrix[idA]?.[idB] || 0) * 100) / 100;
      const owedBtoA = Math.round((matrix[idB]?.[idA] || 0) * 100) / 100;

      const memberA = memberMap.get(idA);
      const memberB = memberMap.get(idB);
      if (!memberA || !memberB) continue;

      if (owedAtoB > owedBtoA + 0.01) {
        const netAmount = Math.round((owedAtoB - owedBtoA) * 100) / 100;
        transactions.push({
          id: `direct-${idA}-${idB}`,
          fromId: idA,
          fromName: memberA.name,
          toId: idB,
          toName: memberB.name,
          toUpiId: memberB.upiId || '',
          amount: netAmount,
          rawFromOwed: owedAtoB,
          rawToOwed: owedBtoA,
          isNeutralized: owedBtoA > 0,
          explanation: owedBtoA > 0 
            ? `Neutralized: ${memberA.name} owed ₹${owedAtoB}, ${memberB.name} owed ₹${owedBtoA} → Net ₹${netAmount}`
            : null
        });
      } else if (owedBtoA > owedAtoB + 0.01) {
        const netAmount = Math.round((owedBtoA - owedAtoB) * 100) / 100;
        transactions.push({
          id: `direct-${idB}-${idA}`,
          fromId: idB,
          fromName: memberB.name,
          toId: idA,
          toName: memberA.name,
          toUpiId: memberA.upiId || '',
          amount: netAmount,
          rawFromOwed: owedBtoA,
          rawToOwed: owedAtoB,
          isNeutralized: owedAtoB > 0,
          explanation: owedAtoB > 0 
            ? `Neutralized: ${memberB.name} owed ₹${owedBtoA}, ${memberA.name} owed ₹${owedAtoB} → Net ₹${netAmount}`
            : null
        });
      }
    }
  }

  // Sort by highest amount first
  transactions.sort((a, b) => b.amount - a.amount);
  return transactions;
}

/**
 * Minimum Cash Flow Algorithm (Global Shortcut Simplification)
 * Merges debts across 3rd parties to achieve minimum total payments.
 */
export function simplifyDebts(balances, members) {
  const memberMap = new Map(members.map(m => [m.id, m]));

  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([memberId, balance]) => {
    const member = memberMap.get(memberId);
    if (!member) return;

    if (balance < -0.01) {
      debtors.push({ id: memberId, name: member.name, upiId: member.upiId, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ id: memberId, name: member.name, upiId: member.upiId, amount: balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const paymentAmount = Math.min(debtor.amount, creditor.amount);
    const roundedPayment = Math.round(paymentAmount * 100) / 100;

    if (roundedPayment > 0.01) {
      transactions.push({
        id: `tx-${debtor.id}-${creditor.id}-${transactions.length}`,
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        toUpiId: creditor.upiId || '',
        amount: roundedPayment,
        isShortcut: true,
      });
    }

    debtor.amount -= paymentAmount;
    creditor.amount -= paymentAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}
