import React, { useState } from 'react';
import { ScriptConfig, CallLog, ObjectionInsight } from '../types/trucking';
import {
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  MessageSquare,
  FileText,
  PhoneCall,
  Scale
} from 'lucide-react';

interface ScriptFeedbackLoopProps {
  scriptConfig: ScriptConfig;
  onUpdateScriptConfig: (config: ScriptConfig) => void;
  callLogs: CallLog[];
}

export const ScriptFeedbackLoop: React.FC<ScriptFeedbackLoopProps> = ({
  scriptConfig,
  onUpdateScriptConfig,
  callLogs,
}) => {
  const [editableConfig, setEditableConfig] = useState<ScriptConfig>({ ...scriptConfig });
  const [isSaved, setIsSaved] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [feedbackInsights, setFeedbackInsights] = useState<{
    topObjections: ObjectionInsight[];
    complianceScore: number;
    complianceNotes: string;
    improvedPitchVariant: string;
  } | null>(null);

  // Handle Save
  const handleSave = () => {
    onUpdateScriptConfig(editableConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Run AI Optimization Audit using Gemini
  const handleRunAiAudit = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/gemini/refine-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: callLogs,
          currentScript: editableConfig,
        }),
      });

      const data = await res.json();
      setFeedbackInsights(data);
    } catch (err) {
      console.error('Audit error', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Reset to default Nexora script
  const handleResetDefaults = () => {
    const defaults: ScriptConfig = {
      companyName: 'Nexora Dispatch Solution LLC',
      agentIdentity: 'Sarah (AI Agent for Sam Ross)',
      repPhone: '+1 (407) 283-7737',
      humanRepName: 'Sam Ross (Senior Dispatch Specialist)',
      websiteUrl: 'https://nexoradispatch.com/setup',
      commissionRate: 'Sprinter Van/Cargo Van: 12% of weekly Gross | Box truck: 10% of weekly Gross | Dry Van: 7% | Reefer: 6% | Hotshot: 10% | Flatbed: 10%',
      primaryPitch: `Hi [Name], this is Sarah with Nexora Dispatch Solution. I’ll keep it quick.
We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers.
Are you currently booking your own loads or working with a dispatcher?`,
      selfDispatchResponse: `I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork.
What type of equipment are you running right now—Dry Van, Reefer, Flatbed, Hotshot, Box Truck, or Sprinter/Cargo Van?`,
      closeResponse: `You stay in control of your lanes and loads—we simply work to keep you loaded. Let’s get your setup started. Would you prefer to set up by phone or through our website?`,
      transferNotice: `Fantastic! I am forwarding you directly to Sam Ross right now for your final setup. Please hold while I connect you.`,
    };
    setEditableConfig(defaults);
    onUpdateScriptConfig(defaults);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">AI Script Refinement & Feedback Loop</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimize cold calling scripts, tune objection handlers, and enforce strict TCPA & FMCSA regulatory standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Script</span>
          </button>

          <button
            disabled={isOptimizing}
            onClick={handleRunAiAudit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Auditing Script...' : 'Run Gemini Feedback Loop'}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved!' : 'Save Script Changes'}</span>
          </button>
        </div>
      </div>

      {/* AI Feedback & Audit Card (if available or run) */}
      {feedbackInsights && (
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Gemini Optimization Analysis & Objection Matrix</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Compliance Score: {feedbackInsights.complianceScore} / 100
            </span>
          </div>

          <p className="text-xs text-slate-300">{feedbackInsights.complianceNotes}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {feedbackInsights.topObjections.map((obj, i) => (
              <div key={i} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span>{obj.objection}</span>
                  <span className="text-[10px] text-slate-400">Freq: {obj.frequency}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                  <strong>Recommendation:</strong> {obj.recommendation}
                </p>
              </div>
            ))}
          </div>

          {feedbackInsights.improvedPitchVariant && (
            <div className="bg-indigo-900/30 p-3.5 rounded-xl border border-indigo-500/30 text-xs space-y-1">
              <span className="font-semibold text-indigo-300 block">Suggested A/B Test Pitch Variant:</span>
              <p className="text-slate-200 italic font-medium leading-relaxed">
                "{feedbackInsights.improvedPitchVariant}"
              </p>
              <button
                onClick={() => setEditableConfig({ ...editableConfig, primaryPitch: feedbackInsights.improvedPitchVariant })}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline mt-1"
              >
                Apply this variant to active script
              </button>
            </div>
          )}
        </div>
      )}

      {/* Script Editor & Compliance Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Nexora Outbound Cold Calling Script Stages</span>
            </h3>

            {/* Stage 1: Mandatory Intro & Value Proposition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">
                  1. Opening Pitch & Lead Qualification Question:
                </label>
                <span className="text-[11px] text-blue-400">Emphasize brevity & value</span>
              </div>
              <textarea
                value={editableConfig.primaryPitch}
                onChange={(e) => setEditableConfig({ ...editableConfig, primaryPitch: e.target.value })}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:border-blue-500 font-sans"
              />
              <p className="text-[11px] text-slate-400">
                Variables: <code className="text-blue-300">[Name]</code> replaces automatically with the driver's name from CSV.
              </p>
            </div>

            {/* Stage 2: If Self-Dispatching Handler */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">
                  2. Empathy Handler (If driver says they book their own loads):
                </label>
                <span className="text-[11px] text-emerald-400">Addresses broker calls & paperwork</span>
              </div>
              <textarea
                value={editableConfig.selfDispatchResponse}
                onChange={(e) => setEditableConfig({ ...editableConfig, selfDispatchResponse: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Stage 3: The Closing Question */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">
                  3. The Soft Close (Choice between Phone Setup vs Website):
                </label>
                <span className="text-[11px] text-purple-400">Driver stays in control</span>
              </div>
              <textarea
                value={editableConfig.closeResponse}
                onChange={(e) => setEditableConfig({ ...editableConfig, closeResponse: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Stage 4: Warm Transfer Announcement */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">
                  4. Warm Transfer Trigger Announcement:
                </label>
                <span className="text-[11px] text-emerald-400">Seamless bridge to Sam Ross</span>
              </div>
              <textarea
                value={editableConfig.transferNotice}
                onChange={(e) => setEditableConfig({ ...editableConfig, transferNotice: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Representative & Business Details */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Human Closing Specialist</label>
                <input
                  type="text"
                  value={editableConfig.humanRepName}
                  onChange={(e) => setEditableConfig({ ...editableConfig, humanRepName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Rep Direct Phone Line</label>
                <input
                  type="text"
                  value={editableConfig.repPhone}
                  onChange={(e) => setEditableConfig({ ...editableConfig, repPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Regulatory Compliance & Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Regulatory Compliance Standards (TCPA & FMCSA)</span>
            </h3>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Immediate Entity Identification</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The AI Agent immediately states: "this is AI Agent for Sam Ross from Nexora Dispatch Solution" within the first 10 seconds of connection.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated Do Not Call (DNC) Enforcement</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  If the owner-operator says "take me off your list" or "not interested", the system immediately tags them as DNC, stops sequential dialing, and acknowledges with empathy.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Permissible Calling Window (8 AM – 9 PM)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The dialer checks area codes to prevent calls outside of the recipient's local daytime hours.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Empathetic Driver Tone</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Short, direct sentences respectful of drivers who may be on the road, at a shipper dock, or fueling up.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-white block">Nexora Dispatch Solution LLC</span>
              <div>📞 +1 (407) 283-7737</div>
              <div>Orlando, FL • Nationwide Dispatch Services</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
