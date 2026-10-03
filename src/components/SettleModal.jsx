import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../utils/formatters';

export function SettleModal({ isOpen, onClose, members, currencySymbol = '₹', onRecordSettlement }) {
  const [fromId, setFromId] = useState(members[0]?.id || '');
  const [toId, setToId] = useState(members[1]?.id || members[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Direct Payment');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }
    if (fromId === toId) {
      setError('Payer and receiver cannot be the same person.');
      return;
    }

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 }
    });

    onRecordSettlement({
      id: `set-${Date.now()}`,
      fromId,
      toId,
      amount: amt,
      date: new Date().toISOString(),
      note: note.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
        
        {/* Mobile Pull Bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Record a Payment
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Log cash, UPI, or bank transfer between two friends
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          
          {/* Who paid Whom */}
          <div className="grid grid-cols-5 gap-2 items-center">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Payer
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center pt-5">
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Receiver
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Amount ({currencySymbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via Google Pay / Cash"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-[0.98]"
            >
              Record Payment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
