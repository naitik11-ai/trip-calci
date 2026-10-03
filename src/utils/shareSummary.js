import { formatCurrency } from './formatters';

/**
 * Generates a WhatsApp-ready formatted message summarizing the entire trip settlement.
 */
export function generateWhatsAppSummary(trip, balances, debtsToSettle = []) {
  const currency = trip.currencySymbol || '₹';
  const totalSpend = (trip.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  let msg = `✈️ *${trip.name.toUpperCase()} — EXPENSE SETTLEMENT*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *Total Trip Spend:* ${formatCurrency(totalSpend, currency)}\n`;
  msg += `👥 *Total Friends:* ${trip.members.length}\n`;
  msg += `🧾 *Total Bills:* ${(trip.expenses || []).length}\n\n`;

  // 1. Final Actionable Settlements
  msg += `⚡ *HOW TO SETTLE UP:*\n`;
  if (debtsToSettle.length === 0) {
    msg += `🎉 Everyone is all squared up! No pending payments.\n\n`;
  } else {
    debtsToSettle.forEach((tx, idx) => {
      const upiText = tx.toUpiId ? ` (UPI: ${tx.toUpiId})` : '';
      const neutralNote = tx.isNeutralized ? ` _(Neutralized direct difference)_` : '';
      msg += `${idx + 1}. *${tx.fromName}* ➡️ pays *${tx.toName}*: ${formatCurrency(tx.amount, currency)}${upiText}${neutralNote}\n`;
    });
    msg += `\n`;
  }

  // 2. Net Balances Breakdown
  msg += `📊 *INDIVIDUAL NET BALANCES:*\n`;
  trip.members.forEach(member => {
    const bal = balances[member.id] || 0;
    if (bal > 0.01) {
      msg += `🟢 *${member.name}:* Gets back ${formatCurrency(bal, currency)}\n`;
    } else if (bal < -0.01) {
      msg += `🔴 *${member.name}:* Owes ${formatCurrency(Math.abs(bal), currency)}\n`;
    } else {
      msg += `⚪ *${member.name}:* Settled (₹0)\n`;
    }
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Generated with FairShare 🏖️`;

  return msg;
}
