import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  Smartphone, 
  Sparkles, 
  History, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  Info,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, generateUpiLink } from '../utils/formatters';
import { AVATAR_COLORS } from '../utils/constants';

export function SettlementView({ 
  trip, 
  balances, 
  totalPaidByMember, 
  totalSpentForMember, 
  directDebts = [], 
  shortcutDebts = [],
  onRecordSettlement, 
  onDeleteSettlement 
}) {
  // 'direct' (pairwise neutralization) vs 'shortcut' (global min-cash-flow)
  const [settleMode, setSettleMode] = useState('direct');
  const [selectedUpiModal, setSelectedUpiModal] = useState(null);

  const currencySymbol = trip.currencySymbol || '₹';
  const memberMap = new Map(trip.members.map(m => [m.id, m]));

  const activeDebts = settleMode === 'direct' ? directDebts : shortcutDebts;

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleSettleDirectly = (tx) => {
    triggerConfetti();
    onRecordSettlement({
      id: `set-${Date.now()}`,
      fromId: tx.fromId,
      toId: tx.toId,
      amount: tx.amount,
      date: new Date().toISOString(),
      note: tx.explanation || 'Direct Settlement'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SETTLEMENT PLAN HEADER & MODE SWITCHER */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Settlement Plan
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {activeDebts.length} {activeDebts.length === 1 ? 'payment' : 'payments'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {settleMode === 'direct'
                ? 'Direct pair-to-pair settlements with 2-way debt neutralization (who actually paid for whom)'
                : '3rd-party merged shortcut (minimum total payments across group)'}
            </p>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setSettleMode('direct')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                settleMode === 'direct'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Neutralized</span>
            </button>
            <button
              onClick={() => setSettleMode('shortcut')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                settleMode === 'shortcut'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Group Shortcut</span>
            </button>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        {activeDebts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">All Debts Settled!</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Nobody owes anything in this trip. All friends are completely squared up! 🎉
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDebts.map((tx) => {
              const fromMember = memberMap.get(tx.fromId);
              const toMember = memberMap.get(tx.toId);
              const upiLink = generateUpiLink(tx.toUpiId, tx.toName, tx.amount, `${trip.name} settlement`);

              return (
                <div 
                  key={tx.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between gap-3.5"
                >
                  {/* From -> To Row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Debtor */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${AVATAR_COLORS[(fromMember?.colorIdx || 0) % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {tx.fromName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{tx.fromName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Pays</div>
                      </div>
                    </div>

                    {/* Arrow with Amount */}
                    <div className="flex flex-col items-center shrink-0 px-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {formatCurrency(tx.amount, currencySymbol)}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="h-[1px] w-6 bg-slate-300"></span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                      <div className="truncate">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{tx.toName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Receives</div>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${AVATAR_COLORS[(toMember?.colorIdx || 0) % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {tx.toName.charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Neutralization Explanation Badge */}
                  {tx.isNeutralized && (
                    <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-1.5 text-[11px] text-blue-900">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Neutralized:</strong> {tx.fromName} paid {formatCurrency(tx.rawToOwed, currencySymbol)} for {tx.toName}, and {tx.toName} paid {formatCurrency(tx.rawFromOwed, currencySymbol)} for {tx.fromName} → Net difference is <strong>{formatCurrency(tx.amount, currencySymbol)}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Actions: UPI / QR & Mark Settle */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                    {tx.toUpiId ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={upiLink}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Pay UPI</span>
                        </a>

                        <button
                          onClick={() => setSelectedUpiModal(tx)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
                          title="View UPI QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        No UPI set
                      </div>
                    )}

                    <button
                      onClick={() => handleSettleDirectly(tx)}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Mark Settled
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. NET BALANCES BREAKDOWN */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Individual Net Balances
          </h3>
          <p className="text-xs text-slate-500">
            Green indicates money to receive; Red indicates money to pay
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {trip.members.map(member => {
            const net = balances[member.id] || 0;
            const paid = totalPaidByMember[member.id] || 0;
            const consumed = totalSpentForMember[member.id] || 0;
            const isOwed = net > 0.01;
            const owes = net < -0.01;

            return (
              <div 
                key={member.id}
                className={`p-4 rounded-xl border flex flex-col justify-between shadow-2xs ${
                  isOwed 
                    ? 'bg-emerald-50/60 border-emerald-200/80' 
                    : owes 
                    ? 'bg-rose-50/60 border-rose-200/80' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-7 h-7 rounded-lg ${AVATAR_COLORS[member.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {member.name}
                    </span>
                  </div>

                  {/* Net Badge */}
                  {isOwed && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{formatCurrency(net, currencySymbol)}
                    </span>
                  )}
                  {owes && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      -{formatCurrency(Math.abs(net), currencySymbol)}
                    </span>
                  )}
                  {!isOwed && !owes && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                      Settled
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs border-t border-slate-200/60 pt-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Paid upfront:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(paid, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual share:</span>
                    <span className="font-medium text-slate-700">{formatCurrency(consumed, currencySymbol)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SETTLEMENT HISTORY */}
      {trip.settlements && trip.settlements.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-400" />
            Settlement History ({trip.settlements.length})
          </h3>

          <div className="space-y-1.5">
            {trip.settlements.map((s) => {
              const fromM = memberMap.get(s.fromId);
              const toM = memberMap.get(s.toId);
              return (
                <div 
                  key={s.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">{fromM?.name}</strong> paid <strong className="text-slate-900">{toM?.name}</strong> {formatCurrency(s.amount, currencySymbol)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Undo this payment record? Balances will be restored.")) {
                        onDeleteSettlement(s.id);
                      }
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                    title="Undo payment"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPI QR Code Modal */}
      {selectedUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Scan & Pay UPI</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pay <strong className="text-slate-800">{selectedUpiModal.toName}</strong> {formatCurrency(selectedUpiModal.amount, currencySymbol)}
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  generateUpiLink(selectedUpiModal.toUpiId, selectedUpiModal.toName, selectedUpiModal.amount)
                )}`} 
                alt="UPI QR Code"
                className="w-40 h-40 mx-auto"
              />
            </div>

            <div className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg mb-4">
              UPI ID: <span className="text-slate-900 font-mono font-semibold">{selectedUpiModal.toUpiId}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUpiModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSettleDirectly(selectedUpiModal);
                  setSelectedUpiModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
