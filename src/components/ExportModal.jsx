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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl p-5 sm:p-6 relative my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Share & Export Settlement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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

        {/* WhatsApp Preview Box */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Message Preview:
            </span>
            <span className="text-slate-400">Ready to send to group</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-h-56 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
            {summaryText}
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopy}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
            </button>

            <button
              onClick={handleWhatsAppRedirect}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Open in WhatsApp
            </button>
          </div>
        </div>

        {/* Backup / Export Section */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Trip Data Backup & Restore
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download JSON
            </button>

            <label className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import JSON</span>
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

        <div className="mt-4 pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
