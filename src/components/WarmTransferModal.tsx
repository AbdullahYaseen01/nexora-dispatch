import React, { useState, useEffect } from 'react';
import { TruckingContact, EQUIPMENT_RATES } from '../types/trucking';
import { PhoneCall, UserCheck, ShieldCheck, CheckCircle2, Send, FileText, X, Sparkles, Volume2, PhoneForwarded } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WarmTransferModalProps {
  contact: TruckingContact;
  leadNotes: string;
  leadScore: number;
  transcriptCount: number;
  isManualIntercept?: boolean;
  onCompleteTransfer: (outcomeNote: string) => void;
  onCancelTransfer: () => void;
}

export const WarmTransferModal: React.FC<WarmTransferModalProps> = ({
  contact,
  leadNotes,
  leadScore,
  transcriptCount,
  isManualIntercept = false,
  onCompleteTransfer,
  onCancelTransfer,
}) => {
  const [transferStage, setTransferStage] = useState<'connecting' | 'connected' | 'onboarded'>('connecting');
  const equipRate = EQUIPMENT_RATES[contact.equipmentType]?.rateText || '7%';
  const [closingNotes, setClosingNotes] = useState(
    `Driver ${contact.name} reached on ${contact.mobile}. Verified ${contact.equipmentType}. Agreed to ${equipRate} dispatch fee. Send Carrier Packet & W9.`
  );

  useEffect(() => {
    // If manually intercepted, connect faster (1s instead of 2.4s)
    const delay = isManualIntercept ? 900 : 2200;
    const timer = setTimeout(() => {
      setTransferStage('connected');
    }, delay);
    return () => clearTimeout(timer);
  }, [isManualIntercept]);

  const handleFinishOnboarding = () => {
    setTransferStage('onboarded');
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      onCompleteTransfer(closingNotes);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-5 border-b border-slate-700 flex items-center justify-between ${
          isManualIntercept
            ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950'
            : 'bg-gradient-to-r from-emerald-900/80 via-slate-800 to-indigo-900/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              isManualIntercept
                ? 'bg-amber-500/20 text-amber-400 border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
            }`}>
              {isManualIntercept ? (
                <PhoneForwarded className="w-6 h-6 animate-pulse" />
              ) : (
                <PhoneCall className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded border ${
                  isManualIntercept
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isManualIntercept ? '⚡ LIVE CALL INTERCEPTED' : 'WARM LIVE TRANSFER'}
                </span>
                <span className="text-xs text-slate-400">Desk Line: +1 (407) 283-7737</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {isManualIntercept
                  ? 'AI Agent Halted: Call Forwarded Directly to You'
                  : 'Forwarding to Sam Ross (Senior Dispatch Specialist)'}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancelTransfer}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {transferStage === 'connecting' && (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex p-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-spin">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-white">Bridging the Live Line to Your Headset...</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isManualIntercept
                  ? 'AI speech halted instantly. Passing line audio and driver CRM record directly to you to take over the conversation.'
                  : `AI Agent verified lead qualification (${leadScore}/100). Forwarding live audio stream & driver CRM context to your desk.`}
              </p>
            </div>
          )}

          {transferStage === 'connected' && (
            <div className="space-y-5">
              {/* Rep Notice */}
              <div className={`border rounded-xl p-4 flex items-start gap-3 ${
                isManualIntercept
                  ? 'bg-amber-950/40 border-amber-500/30'
                  : 'bg-emerald-950/40 border-emerald-500/30'
              }`}>
                <UserCheck className={`w-5 h-5 mt-0.5 shrink-0 ${isManualIntercept ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div className="text-xs space-y-1">
                  <div className={`font-semibold text-sm ${isManualIntercept ? 'text-amber-300' : 'text-emerald-300'}`}>
                    You Are Live on Line 1 with {contact.name} ({contact.mobile})
                  </div>
                  <p className="text-slate-300">
                    {isManualIntercept
                      ? `The AI agent has ceased talking. You are speaking directly with the carrier. Complete the pitch and finalize the ${equipRate} dispatch onboarding below.`
                      : `Lead agreed to setup by phone. Quoted ${equipRate} for ${contact.equipmentType}. Review the live dossier below to complete final closing.`}
                  </p>
                </div>
              </div>

              {/* Lead Dossier Snapshot */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Motor Carrier</span>
                  <span className="font-semibold text-white">{contact.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">MC / DOT</span>
                  <span className="font-mono text-emerald-400 font-semibold">{contact.mcNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Direct Mobile</span>
                  <span className="font-semibold text-white">{contact.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Equipment</span>
                  <span className="font-semibold text-blue-300">{contact.equipmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Preferred Lanes</span>
                  <span className="font-semibold text-slate-200">{contact.preferredLanes}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">AI Lead Score</span>
                  <span className="font-bold text-emerald-400">{leadScore} / 100</span>
                </div>
              </div>

              {/* AI Hand-off Summary */}
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    AI Conversation Handoff Notes:
                  </span>
                  <span className="text-slate-400 text-[11px]">{transcriptCount} turns captured</span>
                </div>
                <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  {leadNotes || `Lead confirmed self-dispatching and verified ${contact.equipmentType} equipment. Customer agreed to phone onboarding and requested immediate load availability for ${contact.preferredLanes}.`}
                </p>
              </div>

              {/* Rep Closing Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Your Final Deal Notes & Onboarding Disposition:
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Nexora Dispatch Agreement ({equipRate} for {contact.equipmentType}, No Forced Dispatch)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onCancelTransfer}
                    className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600"
                  >
                    Resume Audio Call
                  </button>
                  <button
                    onClick={handleFinishOnboarding}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Sale Closed & Sync CRM
                  </button>
                </div>
              </div>
            </div>
          )}

          {transferStage === 'onboarded' && (
            <div className="text-center py-8 space-y-3">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-white">Deal Closed & Carrier Onboarded!</h4>
              <p className="text-xs text-slate-300">
                Contact synced to CRM as <strong>Transferred & Onboarded</strong>. Carrier setup packet sent to {contact.mobile}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
