import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { generateWhatsAppSummary } from '../utils/shareSummary';

export function ExportModal({ 
  isOpen, 
  onClose, 
  trip, 
  balances, 
  simplifiedDebts,
  onImportTrip 
}) {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const summaryText = generateWhatsAppSummary(trip, balances, simplifiedDebts);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppRedirect = () => {
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${trip.name.toLowerCase().replace(/\s+/g, '_')}_expenses.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.name || !Array.isArray(importedData.members)) {
          throw new Error("Invalid trip file structure");
        }
        onImportTrip(importedData);
        onClose();
      } catch (err) {
        setImportError("Failed to parse JSON file. Please ensure it's a valid FairShare trip export.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] sm:max-h-[85vh] flex flex-col relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
        
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Share & Export Settlement
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Copy a formatted summary for WhatsApp group or download backup
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-3.5 pr-0.5">
          {/* WhatsApp Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Message Preview:
              </span>
              <span className="text-slate-400">Ready to send</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px] sm:text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
              {summaryText}
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopy}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span className="truncate">{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleWhatsAppRedirect}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="truncate">Open WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Backup / Export Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Trip Data Backup & Restore
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadJson}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Download JSON</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center active:scale-[0.98]">
                <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Import JSON</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileImport} 
                  className="hidden" 
                />
              </label>
            </div>

            {importError && (
              <p className="text-[11px] text-rose-600">{importError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 text-right shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
