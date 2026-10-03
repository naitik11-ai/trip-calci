import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  Users, 
  Split, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, AVATAR_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

export function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onSave, 
  members = [], 
  currencySymbol = '₹', 
  expenseToEdit = null 
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Payer Mode: 'single' | 'multiple'
  const [payerMode, setPayerMode] = useState('single');
  const [singlePayerId, setSinglePayerId] = useState(members[0]?.id || '');
  const [multiPayers, setMultiPayers] = useState({});

  // Split Mode: 'equal' | 'exact' | 'percentage'
  const [splitMode, setSplitMode] = useState('equal');
  const [includedMembers, setIncludedMembers] = useState(new Set(members.map(m => m.id)));
  const [exactSplits, setExactSplits] = useState({});
  const [percentSplits, setPercentSplits] = useState({});

  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setAmount(expenseToEdit.amount?.toString() || '');
      setCategory(expenseToEdit.category || 'food');
      setNotes(expenseToEdit.notes || '');
      setDate(expenseToEdit.date ? expenseToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);

      if (expenseToEdit.payers && expenseToEdit.payers.length > 1) {
        setPayerMode('multiple');
        const pMap = {};
        expenseToEdit.payers.forEach(p => { pMap[p.memberId] = p.amount.toString(); });
        setMultiPayers(pMap);
      } else {
        setPayerMode('single');
        setSinglePayerId(expenseToEdit.paidById || expenseToEdit.payers?.[0]?.memberId || members[0]?.id);
      }

      setSplitMode(expenseToEdit.splitType || 'equal');
      if (expenseToEdit.splitType === 'exact') {
        const sMap = {};
        expenseToEdit.splits?.forEach(s => { sMap[s.memberId] = s.amount.toString(); });
        setExactSplits(sMap);
      } else if (expenseToEdit.splitType === 'percentage') {
        const pMap = {};
        const total = parseFloat(expenseToEdit.amount) || 1;
        expenseToEdit.splits?.forEach(s => {
          pMap[s.memberId] = ((s.amount / total) * 100).toFixed(0);
        });
        setPercentSplits(pMap);
      } else {
        const included = new Set(expenseToEdit.splits?.map(s => s.memberId) || members.map(m => m.id));
        setIncludedMembers(included);
      }
    } else {
      setTitle('');
      setAmount('');
      setCategory('food');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setPayerMode('single');
      setSinglePayerId(members[0]?.id || '');
      setMultiPayers({});
      setSplitMode('equal');
      setIncludedMembers(new Set(members.map(m => m.id)));
      setExactSplits({});
      setPercentSplits({});
    }
    setError('');
  }, [isOpen, expenseToEdit, members]);

  if (!isOpen) return null;

  const totalBill = parseFloat(amount) || 0;

  const toggleIncludedMember = (id) => {
    const next = new Set(includedMembers);
    if (next.has(id)) {
      if (next.size <= 1) {
        setError('At least one friend must be included in the expense.');
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setIncludedMembers(next);
    setError('');
  };

  const sumMultiPayers = Object.values(multiPayers).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const multiPayersDiff = totalBill - sumMultiPayers;

  const sumExactSplits = Object.values(exactSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const exactDiff = totalBill - sumExactSplits;

  const sumPercents = Object.values(percentSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide what this expense was for (e.g. Dinner, Fuel).');
      return;
    }
    if (totalBill <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }

    // 1. Payers
    let finalPayers = [];
    if (payerMode === 'single') {
      if (!singlePayerId) {
        setError('Please select who paid the bill.');
        return;
      }
      finalPayers = [{ memberId: singlePayerId, amount: totalBill }];
    } else {
      if (Math.abs(multiPayersDiff) > 0.5) {
        setError(`Payer amounts must equal total bill (${formatCurrency(totalBill, currencySymbol)}). Difference: ${formatCurrency(Math.abs(multiPayersDiff), currencySymbol)}`);
        return;
      }
      finalPayers = Object.entries(multiPayers)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([memberId, val]) => ({ memberId, amount: parseFloat(val) }));
    }

    // 2. Splits
    let finalSplits = [];
    if (splitMode === 'equal') {
      const activeIds = Array.from(includedMembers);
      if (activeIds.length === 0) {
        setError('Select at least one friend to split with.');
        return;
      }
      const splitAmount = Math.round((totalBill / activeIds.length) * 100) / 100;
      let accumulated = 0;
      finalSplits = activeIds.map((memberId, idx) => {
        if (idx === activeIds.length - 1) {
          const remaining = Math.round((totalBill - accumulated) * 100) / 100;
          return { memberId, amount: remaining };
        }
        accumulated += splitAmount;
        return { memberId, amount: splitAmount };
      });
    } else if (splitMode === 'exact') {
      if (Math.abs(exactDiff) > 0.5) {
        setError(`Exact splits must add up to ${formatCurrency(totalBill, currencySymbol)}.`);
        return;
      }
      finalSplits = Object.entries(exactSplits)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([memberId, val]) => ({ memberId, amount: parseFloat(val) }));
    } else if (splitMode === 'percentage') {
      if (Math.abs(100 - sumPercents) > 0.5) {
        setError(`Percentages must sum to 100%. Currently: ${sumPercents.toFixed(1)}%`);
        return;
      }
      finalSplits = Object.entries(percentSplits)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([memberId, val]) => ({
          memberId,
          amount: Math.round(((parseFloat(val) / 100) * totalBill) * 100) / 100
        }));
    }

    const expenseData = {
      id: expenseToEdit ? expenseToEdit.id : `exp-${Date.now()}`,
      title: cleanTitle,
      amount: totalBill,
      category,
      date: new Date(date).toISOString(),
      paidById: payerMode === 'single' ? singlePayerId : null,
      payers: finalPayers,
      splitType: splitMode,
      splits: finalSplits,
      notes: notes.trim()
    };

    onSave(expenseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl p-5 sm:p-6 relative my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record a bill and let the app calculate fair shares
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Amount & Title Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount ({currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus={!expenseToEdit}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                What was this for? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dinner, Fuel, Airbnb"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who Paid */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Who Paid?
              </label>
              <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPayerMode('single')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                    payerMode === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Single Payer
                </button>
                <button
                  type="button"
                  onClick={() => setPayerMode('multiple')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                    payerMode === 'multiple' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Multi-Payer
                </button>
              </div>
            </div>

            {payerMode === 'single' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {members.map(m => {
                  const isSelected = singlePayerId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSinglePayerId(m.id)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md ${AVATAR_COLORS[m.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-[9px] shrink-0`}>
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-xs truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <p className="text-[11px] text-slate-500">
                  Enter how much each friend contributed upfront:
                </p>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-xs font-medium text-slate-800 pl-2 truncate">{m.name}</span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={multiPayers[m.id] || ''}
                          onChange={(e) => setMultiPayers({ ...multiPayers, [m.id]: e.target.value })}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-300 rounded-md pl-6 pr-2 py-1 text-xs text-right font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs px-1 pt-1 font-medium">
                  <span className="text-slate-500">Total: {formatCurrency(sumMultiPayers, currencySymbol)}</span>
                  <span className={Math.abs(multiPayersDiff) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}>
                    {Math.abs(multiPayersDiff) < 0.01 ? '✓ Matches Total' : `Remaining: ${formatCurrency(multiPayersDiff, currencySymbol)}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* How to Split */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-slate-500" />
                How to Split?
              </label>

              <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    splitMode === 'equal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('exact')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    splitMode === 'exact' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Exact ₹
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('percentage')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    splitMode === 'percentage' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {/* EQUAL SPLIT */}
            {splitMode === 'equal' && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>Included ({includedMembers.size} of {members.length}):</span>
                  {totalBill > 0 && includedMembers.size > 0 && (
                    <span className="text-slate-800 font-semibold">
                      {formatCurrency(totalBill / includedMembers.size, currencySymbol)} / person
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => {
                    const isChecked = includedMembers.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleIncludedMember(m.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                          isChecked
                            ? 'bg-white border-blue-500/80 text-slate-900 shadow-2xs'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-5 h-5 rounded-md ${AVATAR_COLORS[m.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-[9px] shrink-0`}>
                            {m.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium truncate">{m.name}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EXACT SPLIT */}
            {splitMode === 'exact' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">Specify exact share for each friend:</p>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-xs font-medium text-slate-800 pl-2 truncate">{m.name}</span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={exactSplits[m.id] || ''}
                          onChange={(e) => setExactSplits({ ...exactSplits, [m.id]: e.target.value })}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-300 rounded-md pl-6 pr-2 py-1 text-xs text-right font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs px-1 pt-1 font-medium">
                  <span className="text-slate-500">Total: {formatCurrency(sumExactSplits, currencySymbol)}</span>
                  <span className={Math.abs(exactDiff) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}>
                    {Math.abs(exactDiff) < 0.01 ? '✓ Balanced' : `Remaining: ${formatCurrency(exactDiff, currencySymbol)}`}
                  </span>
                </div>
              </div>
            )}

            {/* PERCENT SPLIT */}
            {splitMode === 'percentage' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">Assign percentage per friend:</p>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-xs font-medium text-slate-800 pl-2 truncate">{m.name}</span>
                      <div className="relative w-24">
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                          %
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={percentSplits[m.id] || ''}
                          onChange={(e) => setPercentSplits({ ...percentSplits, [m.id]: e.target.value })}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-300 rounded-md pl-2 pr-6 py-1 text-xs text-right font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs px-1 pt-1 font-medium">
                  <span className="text-slate-500">Sum: {sumPercents.toFixed(1)}%</span>
                  <span className={Math.abs(100 - sumPercents) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}>
                    {Math.abs(100 - sumPercents) < 0.01 ? '✓ 100%' : `Diff: ${(100 - sumPercents).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via Google Pay"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
