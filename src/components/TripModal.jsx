import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, Coins, MapPin, AlertCircle } from 'lucide-react';
import { CURRENCIES, AVATAR_COLORS } from '../utils/constants';

const TRIP_PRESETS = [
  'Goa Weekend Getaway',
  'Manali Road Trip',
  'Friday Dinner & Drinks',
  'Flat / Roommates Month',
  'College Reunion Trip',
  'Trekking & Camping'
];

export function TripModal({ isOpen, onClose, onSave, tripToEdit, onDeleteTrip }) {
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUpi, setNewMemberUpi] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (tripToEdit) {
      setName(tripToEdit.name || '');
      setCurrencyCode(tripToEdit.currencyCode || 'INR');
      setMembers(tripToEdit.members || []);
    } else {
      setName('');
      setCurrencyCode('INR');
      setMembers([
        { id: 'm-1', name: 'Me (You)', upiId: '', colorIdx: 0 },
        { id: 'm-2', name: 'Friend 1', upiId: '', colorIdx: 1 },
      ]);
    }
    setError('');
  }, [tripToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddMember = (e) => {
    if (e) e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    if (members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in this trip.`);
      return;
    }

    const newMember = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: trimmed,
      upiId: newMemberUpi.trim(),
      colorIdx: members.length % AVATAR_COLORS.length,
    };

    setMembers([...members, newMember]);
    setNewMemberName('');
    setNewMemberUpi('');
    setError('');
  };

  const handleRemoveMember = (memberId) => {
    if (tripToEdit && tripToEdit.expenses) {
      const isUsed = tripToEdit.expenses.some(exp => 
        (exp.payers && exp.payers.some(p => p.memberId === memberId)) ||
        (exp.paidById === memberId) ||
        (exp.splits && exp.splits.some(s => s.memberId === memberId))
      );
      if (isUsed) {
        setError("Cannot remove this friend because they have recorded expenses.");
        return;
      }
    }

    if (members.length <= 2) {
      setError("A trip needs at least 2 friends to split expenses.");
      return;
    }

    setMembers(members.filter(m => m.id !== memberId));
    setError('');
  };

  const handleUpdateMemberUpi = (memberId, upi) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, upiId: upi } : m));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a trip name.');
      return;
    }
    if (members.length < 2) {
      setError('Please add at least 2 friends.');
      return;
    }

    const selectedCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

    const tripData = {
      id: tripToEdit ? tripToEdit.id : `trip-${Date.now()}`,
      name: trimmedName,
      currencyCode: selectedCurrency.code,
      currencySymbol: selectedCurrency.symbol,
      createdAt: tripToEdit ? tripToEdit.createdAt : new Date().toISOString(),
      members: members,
      expenses: tripToEdit ? tripToEdit.expenses : [],
      settlements: tripToEdit ? tripToEdit.settlements : [],
    };

    onSave(tripData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] sm:max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
        
        {/* Mobile Pull Bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {tripToEdit ? 'Edit Trip & Friends' : 'Create New Trip'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Set up your friends group to start tracking expenses
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
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 flex-1 overflow-y-auto space-y-3.5 pr-0.5">
          {/* Trip Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trip / Outing Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Weekend, Manali Trip"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
            />
            {/* Quick Presets */}
            {!tripToEdit && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TRIP_PRESETS.slice(0, 3).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors active:scale-[0.97]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-slate-500" />
              Currency
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {CURRENCIES.map(curr => {
                const isSelected = currencyCode === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setCurrencyCode(curr.code)}
                    className={`p-2 rounded-xl text-center border text-xs font-medium transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base font-bold">{curr.symbol}</div>
                    <div className="text-[10px] text-slate-500">{curr.code}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Friends List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Friends In This Trip ({members.length})
              </label>
              <span className="text-[10px] sm:text-[11px] text-slate-400">Min. 2 friends</span>
            </div>

            {/* Existing Members */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
              {members.map((m) => (
                <div 
                  key={m.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded-md ${AVATAR_COLORS[m.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-[10px] shrink-0`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-xs sm:text-sm text-slate-900 truncate">
                      {m.name}
                    </span>
                  </div>

                  {/* UPI Input */}
                  <div className="w-28 xs:w-36 sm:w-44">
                    <input
                      type="text"
                      value={m.upiId || ''}
                      onChange={(e) => handleUpdateMemberUpi(m.id, e.target.value)}
                      placeholder="UPI (optional)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors active:scale-[0.95]"
                    title="Remove friend"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Friend Input */}
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Friend's Name"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 flex items-center justify-between shrink-0">
            {tripToEdit && onDeleteTrip ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${tripToEdit.name}"?`)) {
                    onDeleteTrip(tripToEdit.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-xl active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors active:scale-[0.98]"
              >
                {tripToEdit ? 'Save Changes' : 'Create Trip'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
