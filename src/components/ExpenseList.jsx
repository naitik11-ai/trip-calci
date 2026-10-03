import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Receipt,
  Utensils,
  Car,
  Bed,
  Wine,
  Ticket,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { CATEGORIES, AVATAR_COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';

const CATEGORY_ICONS = {
  food: Utensils,
  travel: Car,
  stay: Bed,
  drinks: Wine,
  activities: Ticket,
  groceries: ShoppingBag,
  general: Receipt,
};

export function ExpenseList({ 
  expenses = [], 
  members = [], 
  currencySymbol = '₹', 
  onEditExpense, 
  onDeleteExpense,
  onOpenAddExpense 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses, restaurants, bills..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({expenses.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat.id).length;
            if (count === 0 && selectedCategory !== cat.id) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

      </div>

      {/* Expenses Feed */}
      {filteredExpenses.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-white border border-dashed border-slate-200">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {searchTerm || selectedCategory !== 'all' ? 'No matching expenses' : 'No expenses added yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try changing your search keywords or category filters.'
              : 'Add your first bill (fuel, dinner, hotel, snacks) to see the split in action.'}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => {
            const isExpanded = expandedId === exp.id;
            const CategoryIcon = CATEGORY_ICONS[exp.category] || Receipt;
            const catMeta = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[6];

            // Resolve Payer Names
            let payerLabel = '';
            if (exp.payers && exp.payers.length > 1) {
              payerLabel = exp.payers.map(p => {
                const name = memberMap.get(p.memberId)?.name || 'Someone';
                return `${name} (${formatCurrency(p.amount, currencySymbol)})`;
              }).join(' & ');
            } else {
              const singlePayer = exp.paidById || exp.payers?.[0]?.memberId;
              payerLabel = memberMap.get(singlePayer)?.name || 'Someone';
            }

            return (
              <div
                key={exp.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl transition-all shadow-xs overflow-hidden"
              >
                {/* Main Card Row */}
                <div 
                  onClick={() => toggleExpand(exp.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${catMeta.color} border flex items-center justify-center shrink-0`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                        {exp.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                        <span>
                          Paid by <strong className="text-slate-800 font-semibold">{payerLabel}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDate(exp.date)}
                        </span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-[120px] sm:max-w-xs italic">
                              "{exp.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-slate-900">
                        {formatCurrency(exp.amount, currencySymbol)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {exp.splits?.length || 0} friends split
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expandable Breakdown Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Share Breakdown ({exp.splitType === 'equal' ? 'Split Equally' : exp.splitType === 'exact' ? 'Exact Split' : 'Percentage Split'})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditExpense(exp);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${exp.title}"?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Member split cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {exp.splits?.map(split => {
                        const member = memberMap.get(split.memberId);
                        if (!member) return null;
                        return (
                          <div 
                            key={split.memberId}
                            className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <div className={`w-5 h-5 rounded-md ${AVATAR_COLORS[member.colorIdx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-[9px] shrink-0`}>
                                {member.name.charAt(0)}
                              </div>
                              <span className="text-xs text-slate-700 font-medium truncate">
                                {member.name}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-900 shrink-0 ml-1">
                              {formatCurrency(split.amount, currencySymbol)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
