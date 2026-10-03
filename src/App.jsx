import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  ArrowLeftRight, 
  PieChart, 
  Plus, 
  CheckCircle2, 
  Share2, 
  Users,
  CreditCard
} from 'lucide-react';
import { 
  loadTrips, 
  saveTrips, 
  loadActiveTripId, 
  saveActiveTripId, 
  SAMPLE_TRIP 
} from './utils/storage';
import { 
  calculateBalances, 
  simplifyDebts, 
  calculateDirectPairwiseDebts 
} from './utils/debtSimplifier';
import { formatCurrency } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { TripModal } from './components/TripModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ExpenseList } from './components/ExpenseList';
import { SettlementView } from './components/SettlementView';
import { AnalyticsView } from './components/AnalyticsView';
import { ExportModal } from './components/ExportModal';
import { SettleModal } from './components/SettleModal';

export function App() {
  const [trips, setTrips] = useState(() => loadTrips());
  const [activeTripId, setActiveTripId] = useState(() => loadActiveTripId());
  
  // Navigation: 'expenses' | 'settlement' | 'analytics'
  const [activeTab, setActiveTab] = useState('expenses');

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  useEffect(() => {
    saveActiveTripId(activeTripId);
  }, [activeTripId]);

  // Current active trip
  const activeTrip = useMemo(() => {
    return trips.find(t => t.id === activeTripId) || trips[0] || SAMPLE_TRIP;
  }, [trips, activeTripId]);

  // Net balances calculations for active trip
  const { balances, totalPaidByMember, totalSpentForMember } = useMemo(() => {
    if (!activeTrip) return { balances: {}, totalPaidByMember: {}, totalSpentForMember: {} };
    return calculateBalances(
      activeTrip.members || [], 
      activeTrip.expenses || [], 
      activeTrip.settlements || []
    );
  }, [activeTrip]);

  // 1. Direct Pairwise Neutralized Debts (natural settlements without 3rd party mixing)
  const directDebts = useMemo(() => {
    if (!activeTrip) return [];
    return calculateDirectPairwiseDebts(
      activeTrip.members || [], 
      activeTrip.expenses || [], 
      activeTrip.settlements || []
    );
  }, [activeTrip]);

  // 2. Global Shortcut Simplification (min cash flow graph algorithm)
  const shortcutDebts = useMemo(() => {
    if (!activeTrip) return [];
    return simplifyDebts(balances, activeTrip.members || []);
  }, [balances, activeTrip]);

  // Trip operations
  const handleSaveTrip = (tripData) => {
    const exists = trips.some(t => t.id === tripData.id);
    let updated;
    if (exists) {
      updated = trips.map(t => t.id === tripData.id ? tripData : t);
    } else {
      updated = [tripData, ...trips];
    }
    setTrips(updated);
    setActiveTripId(tripData.id);
  };

  const handleDeleteTrip = (tripId) => {
    const remaining = trips.filter(t => t.id !== tripId);
    if (remaining.length === 0) {
      setTrips([SAMPLE_TRIP]);
      setActiveTripId(SAMPLE_TRIP.id);
    } else {
      setTrips(remaining);
      setActiveTripId(remaining[0].id);
    }
  };

  const handleResetDemo = () => {
    const existingIndex = trips.findIndex(t => t.id === SAMPLE_TRIP.id);
    let updated;
    if (existingIndex >= 0) {
      updated = trips.map(t => t.id === SAMPLE_TRIP.id ? SAMPLE_TRIP : t);
    } else {
      updated = [SAMPLE_TRIP, ...trips];
    }
    setTrips(updated);
    setActiveTripId(SAMPLE_TRIP.id);
  };

  // Expense operations
  const handleSaveExpense = (expenseData) => {
    const currentExpenses = activeTrip.expenses || [];
    const exists = currentExpenses.some(e => e.id === expenseData.id);
    let newExpenses;
    if (exists) {
      newExpenses = currentExpenses.map(e => e.id === expenseData.id ? expenseData : e);
    } else {
      newExpenses = [expenseData, ...currentExpenses];
    }

    const updatedTrip = { ...activeTrip, expenses: newExpenses };
    setTrips(trips.map(t => t.id === activeTrip.id ? updatedTrip : t));
  };

  const handleDeleteExpense = (expenseId) => {
    const newExpenses = (activeTrip.expenses || []).filter(e => e.id !== expenseId);
    const updatedTrip = { ...activeTrip, expenses: newExpenses };
    setTrips(trips.map(t => t.id === activeTrip.id ? updatedTrip : t));
  };

  // Settlement operations
  const handleRecordSettlement = (settlementData) => {
    const currentSettlements = activeTrip.settlements || [];
    const newSettlements = [settlementData, ...currentSettlements];
    const updatedTrip = { ...activeTrip, settlements: newSettlements };
    setTrips(trips.map(t => t.id === activeTrip.id ? updatedTrip : t));
  };

  const handleDeleteSettlement = (settlementId) => {
    const newSettlements = (activeTrip.settlements || []).filter(s => s.id !== settlementId);
    const updatedTrip = { ...activeTrip, settlements: newSettlements };
    setTrips(trips.map(t => t.id === activeTrip.id ? updatedTrip : t));
  };

  const handleImportTrip = (importedData) => {
    const updated = [importedData, ...trips.filter(t => t.id !== importedData.id)];
    setTrips(updated);
    setActiveTripId(importedData.id);
  };

  const totalTripSpend = (activeTrip.expenses || []).reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0), 
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24">
      
      {/* Top Navbar */}
      <Navbar
        trips={trips}
        activeTrip={activeTrip}
        onSelectTrip={(id) => setActiveTripId(id)}
        onOpenNewTripModal={() => {
          setTripToEdit(null);
          setIsTripModalOpen(true);
        }}
        onOpenEditTripModal={() => {
          setTripToEdit(activeTrip);
          setIsTripModalOpen(true);
        }}
        onOpenShareModal={() => setIsExportModalOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 w-full flex-1 pt-5 sm:pt-7">
        
        {/* Clean Trip Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>{activeTrip.members.length} friends</span>
                <span>•</span>
                <span>Currency: {activeTrip.currencyCode || 'INR'} ({activeTrip.currencySymbol || '₹'})</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {activeTrip.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1.5">
                <span>Total spent: <strong className="text-slate-900 font-semibold">{formatCurrency(totalTripSpend, activeTrip.currencySymbol || '₹')}</strong></span>
                <span>•</span>
                {directDebts.length > 0 ? (
                  <span className="text-amber-700 font-medium">
                    {directDebts.length} {directDebts.length === 1 ? 'payment' : 'payments'} pending
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    All settled up
                  </span>
                )}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettleModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Segmented Tab Switcher */}
        <div className="flex p-1 bg-slate-200/70 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Expenses ({(activeTrip.expenses || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'settlement'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-500" />
            <span>Who Owes Whom</span>
            {directDebts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {directDebts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4 text-slate-500" />
            <span>Breakdown</span>
          </button>
        </div>

        {/* Tab 1: Expenses Feed */}
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={activeTrip.expenses || []}
            members={activeTrip.members || []}
            currencySymbol={activeTrip.currencySymbol || '₹'}
            onEditExpense={(exp) => {
              setExpenseToEdit(exp);
              setIsAddExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onOpenAddExpense={() => {
              setExpenseToEdit(null);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {/* Tab 2: Settlements & Net Balances */}
        {activeTab === 'settlement' && (
          <SettlementView
            trip={activeTrip}
            balances={balances}
            totalPaidByMember={totalPaidByMember}
            totalSpentForMember={totalSpentForMember}
            directDebts={directDebts}
            shortcutDebts={shortcutDebts}
            onRecordSettlement={handleRecordSettlement}
            onDeleteSettlement={handleDeleteSettlement}
          />
        )}

        {/* Tab 3: Analytics & Visuals */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            trip={activeTrip}
            totalPaidByMember={totalPaidByMember}
            totalSpentForMember={totalSpentForMember}
          />
        )}

      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => {
            setExpenseToEdit(null);
            setIsAddExpenseOpen(true);
          }}
          className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          title="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        onSave={handleSaveTrip}
        tripToEdit={tripToEdit}
        onDeleteTrip={handleDeleteTrip}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        members={activeTrip.members || []}
        currencySymbol={activeTrip.currencySymbol || '₹'}
        expenseToEdit={expenseToEdit}
      />

      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        members={activeTrip.members || []}
        currencySymbol={activeTrip.currencySymbol || '₹'}
        onRecordSettlement={handleRecordSettlement}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        trip={activeTrip}
        balances={balances}
        simplifiedDebts={directDebts}
        onImportTrip={handleImportTrip}
      />

    </div>
  );
}

export default App;
