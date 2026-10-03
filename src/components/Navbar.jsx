import React, { useState } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Share2, 
  Settings, 
  Check,
  Sparkles,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function Navbar({ 
  trips, 
  activeTrip, 
  onSelectTrip, 
  onOpenNewTripModal, 
  onOpenEditTripModal, 
  onOpenShareModal,
  onResetDemo
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const totalTripSpend = (activeTrip.expenses || []).reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0), 
    0
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Brand & Trip Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group bg-white shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Active Trip
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                {activeTrip.name}
              </h1>
            </div>
          </button>

          {/* Trip Selector Menu */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Your Trips</span>
                  <span className="text-slate-400">{trips.length} total</span>
                </div>
                
                <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                  {trips.map(trip => {
                    const isSelected = trip.id === activeTrip.id;
                    const tripSpend = (trip.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                    return (
                      <button
                        key={trip.id}
                        onClick={() => {
                          onSelectTrip(trip.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-50 text-blue-900 font-semibold' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="text-sm truncate flex items-center gap-1.5">
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[3]" />}
                            {trip.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {trip.members.length} friends • {formatCurrency(tripSpend, trip.currencySymbol || '₹')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewTripModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Trip
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onResetDemo();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-100 text-slate-600 text-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Reset to Demo Goa Trip
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Total on Desktop */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-slate-100 rounded-xl">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Trip Spend</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(totalTripSpend, activeTrip.currencySymbol || '₹')}
            </span>
          </div>

          {/* Share on WhatsApp */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden xs:inline">Share / Export</span>
          </button>

          {/* Trip Settings */}
          <button
            onClick={onOpenEditTripModal}
            title="Edit Trip & Friends"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
