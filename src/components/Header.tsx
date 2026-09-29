import React from 'react';
import { PhoneCall, Users, Layers, BarChart3, SlidersHorizontal, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dialer' | 'contacts' | 'crm' | 'analytics' | 'feedback';
  setActiveTab: (tab: 'dialer' | 'contacts' | 'crm' | 'analytics' | 'feedback') => void;
  queueCount: number;
  completedCount: number;
  qualifiedCount: number;
  transferredCount: number;
  isDialerRunning: boolean;
  onOpenDirectDial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  completedCount,
  qualifiedCount,
  transferredCount,
  isDialerRunning,
  onOpenDirectDial,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Notification / Regulatory Compliance Stripe */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950 px-4 py-1.5 text-xs border-b border-blue-500/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDialerRunning ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isDialerRunning ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
          </span>
          <span className="font-semibold text-white">Nexora Voice Engine</span>
          <span className="text-slate-400">|</span>
          <span className="text-pink-300">Live Agent: <strong className="text-white">Sarah (Nice Lady Voice)</strong></span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Outreach Desk: <strong className="text-emerald-400">📞 +1 (407) 283-7737</strong></span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TCPA & DNC Compliant (8 AM – 9 PM Window)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini NLP Lead Qualifier</span>
          </div>
        </div>
      </div>

      {/* Main Brand & Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Nexora Dispatch Solution
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                LLC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Trucking Cold Caller • Lead Qualification • CRM & Warm Transfer
            </p>
          </div>
        </div>

        {/* Real-time Queue & Outcome Counters + Quick Dial Button */}
        <div className="flex items-center gap-3">
          {onOpenDirectDial && (
            <button
              onClick={onOpenDirectDial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 transition-all border border-blue-400/40"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>⚡ Dial Lead Number</span>
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-4 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <div className="text-center px-1">
              <div className="text-slate-400 text-[10px] uppercase">Queue</div>
              <div className="font-bold text-white text-sm">{queueCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center px-1">
              <div className="text-slate-400 text-[10px] uppercase">Dialed</div>
              <div className="font-bold text-slate-200 text-sm">{completedCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center px-1">
              <div className="text-blue-400 text-[10px] uppercase">Qualified</div>
              <div className="font-bold text-blue-400 text-sm">{qualifiedCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center px-1">
              <div className="text-emerald-400 text-[10px] uppercase">Transferred</div>
              <div className="font-bold text-emerald-400 text-sm">{transferredCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('dialer')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'dialer'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Live Auto-Dialer Console</span>
          {isDialerRunning && (
            <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'contacts'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contact List & CSV</span>
          <span className="ml-1 text-[11px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">
            {queueCount + completedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'crm'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>CRM Pipeline & Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Call Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'feedback'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Feedback Loop & Script Refinement</span>
        </button>
      </div>
    </header>
  );
};
