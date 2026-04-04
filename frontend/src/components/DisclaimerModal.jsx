import { X, Lightbulb, AlertTriangle } from 'lucide-react';
import { useTheme } from '../App.jsx';

export default function DisclaimerModal({ isOpen, onClose }) {
  const { dark } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative z-10 w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up ${dark ? 'bg-slate-800 text-slate-100' : 'bg-white text-gray-800'}`}>

        {/* Header stripe */}
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-yellow-600" />
              </div>
              <h2 id="disclaimer-title" className="text-lg font-bold">
                About Your Projected Bill
              </h2>
            </div>
            <button
              id="btn-close-disclaimer"
              onClick={onClose}
              className={`p-1.5 rounded-lg ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              aria-label="Close disclaimer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className={`space-y-3 text-sm ${dark ? 'text-slate-300' : 'text-gray-600'}`}>
            <p>
              Voltify's bill projection is an <strong className={dark ? 'text-white' : 'text-gray-900'}>intelligent estimate</strong> designed to help you understand and manage your electricity consumption.
            </p>
            <p>
              These calculations are based on the appliance data you enter and the official <strong className={dark ? 'text-white' : 'text-gray-900'}>Mahavitaran (MSEDCL) slab rates</strong> for LT-I Domestic consumers in Maharashtra.
            </p>

            <div className={`rounded-xl p-3 ${dark ? 'bg-slate-700/60' : 'bg-blue-50'} border ${dark ? 'border-slate-600' : 'border-blue-200'}`}>
              <div className="flex gap-2">
                <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  Your actual bill may differ due to meter readings, fixed charges, electricity duty, and any government surcharges applied by MSEDCL.
                </p>
              </div>
            </div>

            <p>
              Always verify with your official monthly bill. Voltify is a <strong className={dark ? 'text-white' : 'text-gray-900'}>decision-support tool</strong>, not a replacement for your official electricity supplier.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3">
            <button
              id="btn-disclaimer-understood"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow"
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
