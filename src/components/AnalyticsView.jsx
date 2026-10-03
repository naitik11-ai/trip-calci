import React from 'react';
import { 
  Receipt, 
  Utensils, 
  Car, 
  Bed, 
  Wine, 
  Ticket, 
  ShoppingBag 
} from 'lucide-react';
import { CATEGORIES, AVATAR_COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_ICONS = {
  food: Utensils,
  travel: Car,
  stay: Bed,
  drinks: Wine,
  activities: Ticket,
  groceries: ShoppingBag,
  general: Receipt,
};

export function AnalyticsView({ trip, totalPaidByMember, totalSpentForMember }) {
  const currencySymbol = trip.currencySymbol || '₹';
  const expenses = trip.expenses || [];
  const members = trip.members || [];

  const totalTripSpend = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const avgPerPerson = members.length > 0 ? totalTripSpend / members.length : 0;

  // Category breakdown
  const categoryTotals = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (parseFloat(e.amount) || 0);
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  // Highest single expense
  let maxExpense = null;
  if (expenses.length > 0) {
    maxExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  }

  // Top payer
  let topPayerId = null;
  let maxPaid = -1;
  Object.entries(totalPaidByMember).forEach(([mId, amt]) => {
    if (amt > maxPaid) {
      maxPaid = amt;
      topPayerId = mId;
    }
  });
  const topPayer = members.find(m => m.id === topPayerId);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Stat Cards (2x2 on mobile, 4 in row on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Spend</span>
          <div className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(totalTripSpend, currencySymbol)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">{expenses.length} bills total</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Avg Per Friend</span>
          <div className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(avgPerPerson, currencySymbol)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">{members.length} friends</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Top Contributor</span>
          <div className="text-xs xs:text-sm sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
            {topPayer ? topPayer.name : '—'}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate block">
            {topPayer ? formatCurrency(maxPaid, currencySymbol) : '0'}
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Largest Bill</span>
          <div className="text-xs xs:text-sm sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 truncate">
            {maxExpense ? maxExpense.title : '—'}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate block">
            {maxExpense ? formatCurrency(maxExpense.amount, currencySymbol) : '0'}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5 sm:space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Spending by Category</h3>
          <p className="text-[11px] sm:text-xs text-slate-500">Distribution of all group expenses</p>
        </div>

        {sortedCategories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No expenses to display</p>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {sortedCategories.map(([catId, amt]) => {
              const catMeta = CATEGORIES.find(c => c.id === catId) || CATEGORIES[6];
              const Icon = CATEGORY_ICONS[catId] || Receipt;
              const pct = totalTripSpend > 0 ? (amt / totalTripSpend) * 100 : 0;

              return (
                <div key={catId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${catMeta.color} border flex items-center justify-center shrink-0`}>
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className="font-medium text-slate-700 truncate">{catMeta.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-900">{formatCurrency(amt, currencySymbol)}</span>
                      <span className="text-slate-400 w-8 sm:w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-Friend Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5 sm:space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Members Spend Summary</h3>
          <p className="text-[11px] sm:text-xs text-slate-500">Paid upfront vs consumed share per friend</p>
        </div>

        <div className="overflow-x-auto -mx-1 px-1 sm:mx-0">
          <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sm:text-xs">
                <th className="pb-2">Friend</th>
                <th className="pb-2 text-right">Paid Upfront</th>
                <th className="pb-2 text-right">Actual Share</th>
                <th className="pb-2 text-right">% of Trip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(m => {
                const paid = totalPaidByMember[m.id] || 0;
                const consumed = totalSpentForMember[m.id] || 0;
                const pctOfTrip = totalTripSpend > 0 ? (consumed / totalTripSpend) * 100 : 0;

                return (
                  <tr key={m.id} className="text-slate-700">
                    <td className="py-2.5 flex items-center gap-1.5 sm:gap-2">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${AVATAR_COLORS[m.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-[9px] sm:text-[10px] shrink-0`}>
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900 truncate">{m.name}</span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(paid, currencySymbol)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-700">
                      {formatCurrency(consumed, currencySymbol)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 font-medium">
                      {pctOfTrip.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
