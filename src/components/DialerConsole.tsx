import React, { useState, useEffect, useRef } from 'react';
import { TruckingContact, CallLog, ScriptConfig, EQUIPMENT_RATES, EquipmentCategory } from '../types/trucking';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  UserCheck,
  ShieldCheck,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  PhoneForwarded,
  Square,
  PlusCircle,
  X,
  Volume1,
  Copy,
  Check,
  Truck,
  Percent,
  MessageSquare
} from 'lucide-react';
import {
  startPhoneRing,
  stopPhoneRing,
  playCallConnectedSound,
  playCallEndSound,
  playTransferChime,
  speakAgentText,
  stopSpeaking,
  createSpeechRecognizer,
  AMERICAN_VOICES,
} from '../utils/audio';
import { WarmTransferModal } from './WarmTransferModal';

interface DialerConsoleProps {
  contacts: TruckingContact[];
  onUpdateContact: (contact: TruckingContact) => void;
  onSaveCallLog: (log: CallLog) => void;
  onAddAndDialContact?: (contact: TruckingContact) => void;
  scriptConfig: ScriptConfig;
  isAutoDialerActive: boolean;
  setIsAutoDialerActive: (active: boolean) => void;
}

export const DialerConsole: React.FC<DialerConsoleProps> = ({
  contacts,
  onUpdateContact,
  onSaveCallLog,
  onAddAndDialContact,
  scriptConfig,
  isAutoDialerActive,
  setIsAutoDialerActive,
}) => {
  // Dialer State
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [dialDelaySeconds, setDialDelaySeconds] = useState(4);
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'transferring' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'agent' | 'lead'; text: string; time: string }>>([]);
  const [leadSpeechInput, setLeadSpeechInput] = useState('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [leadScore, setLeadScore] = useState(65);
  // Default to Nice American Lady Voice: Kore (Sarah)
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Aoede' | 'Puck' | 'Zephyr' | 'Fenrir'>('Kore');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [qualificationTags, setQualificationTags] = useState<{
    isSelfDispatching?: boolean;
    setupPreference?: string;
    objection?: string;
    equipment?: string;
    quotedFee?: string;
  }>({});
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isManualIntercept, setIsManualIntercept] = useState(false);
  const [isAiSimulating, setIsAiSimulating] = useState(false);
  const [complianceNotice, setComplianceNotice] = useState('TCPA Initial Identification: Ready');
  const [isDirectDialModalOpen, setIsDirectDialModalOpen] = useState(false);

  // Quick Direct Dial Form State
  const [directNumber, setDirectNumber] = useState('');
  const [directName, setDirectName] = useState('');
  const [directCompany, setDirectCompany] = useState('');
  const [directMc, setDirectMc] = useState('');
  const [directEquip, setDirectEquip] = useState<EquipmentCategory>('Dry Van');
  const [directLanes, setDirectLanes] = useState('Southeast to Midwest');

  const timerRef = useRef<any>(null);
  const speechRecognizerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentContact = contacts[currentContactIndex] || contacts[0];

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean audio on unmount & listener
  useEffect(() => {
    const handleOpen = () => {
      setIsDirectDialModalOpen(true);
    };
    window.addEventListener('open-direct-dial', handleOpen);

    return () => {
      window.removeEventListener('open-direct-dial', handleOpen);
      stopPhoneRing();
      stopSpeaking();
      if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Outbound Call Sequence
  const initiateCall = (contact: TruckingContact) => {
    if (!contact) return;
    stopSpeaking();
    setIsAgentSpeaking(false);
    setTranscript([]);
    setCallDuration(0);
    setQualificationTags({
      equipment: contact.equipmentType,
      quotedFee: EQUIPMENT_RATES[contact.equipmentType]?.rateText || '7%',
    });
    setLeadScore(60);
    setCallState('dialing');
    setIsManualIntercept(false);
    setComplianceNotice('Dialing recipient in compliance with 8am-9pm local calling window...');

    // Update status to Ringing
    onUpdateContact({ ...contact, status: 'Ringing' });

    // Transition to Ringing with realistic audio
    setTimeout(() => {
      setCallState('ringing');
      if (!voiceMuted) startPhoneRing();

      // Recipient answers after 2.5 seconds
      setTimeout(() => {
        stopPhoneRing();
        if (!voiceMuted) playCallConnectedSound();
        setCallState('connected');
        onUpdateContact({ ...contact, status: 'In Call' });
        setComplianceNotice('TCPA & Opt-Out Notice Active: Nexora Dispatch Solution LLC');

        // AI Agent (Sarah - Nice Lady Voice) starts the cold call script
        const introText = `Hi ${contact.name}, this is Sarah with Nexora Dispatch Solution. I’ll keep it quick. We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers. Are you currently booking your own loads or working with a dispatcher?`;

        setTranscript([{ speaker: 'agent', text: introText, time: '00:01' }]);

        if (!voiceMuted) {
          speakAgentText(
            introText,
            selectedVoice,
            () => setIsAgentSpeaking(true),
            () => setIsAgentSpeaking(false)
          );
        }
      }, 2600);
    }, 1200);
  };

  // STOP AI AGENT ANYWHERE & FORWARD CALL TO ME (Instant Human Rep Intercept)
  const handleStopAgentAndForwardToMe = () => {
    stopSpeaking();
    setIsAgentSpeaking(false);
    if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
    setIsMicListening(false);

    playTransferChime();
    setIsManualIntercept(true);
    setTransferModalOpen(true);

    const timestamp = formatTime(callDuration);
    setTranscript((prev) => [
      ...prev,
      {
        speaker: 'agent',
        text: '⚡ [AI Agent Halted by Operator]: Call line forwarded directly to Sam Ross.',
        time: timestamp,
      },
    ]);
  };

  // Silence/Pause Agent Speech immediately
  const handleSilenceAgent = () => {
    stopSpeaking();
    setIsAgentSpeaking(false);
  };

  // Direct Dial A Number On The Fly to Create a Sale
  const handleDirectDialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directNumber.trim()) return;

    const newLead: TruckingContact = {
      id: 'direct-' + Date.now(),
      name: directName.trim() || 'Owner Operator',
      mobile: directNumber.trim(),
      companyName: directCompany.trim() || (directName ? `${directName} Transport` : 'Commercial Motor Carrier'),
      mcNumber: directMc.trim() || 'MC-' + Math.floor(100000 + Math.random() * 900000),
      equipmentType: directEquip,
      preferredLanes: directLanes.trim() || 'Regional / OTR',
      truckCount: 1,
      status: 'Pending',
    };

    if (onAddAndDialContact) {
      onAddAndDialContact(newLead);
    } else {
      onUpdateContact(newLead);
    }

    setIsDirectDialModalOpen(false);
    setDirectNumber('');
    setDirectName('');
    setDirectCompany('');
    setDirectMc('');

    initiateCall(newLead);
  };

  // Test Nice Lady Voice (Sarah) Preview
  const handleTestLadyVoice = () => {
    stopSpeaking();
    const sampleLine = `Hi, I'm Sarah with Nexora Dispatch. For Dry Van our fee is 7%, Reefer is 6%, Flatbed and Hotshot are 10%, Box Trucks are 10% of weekly gross, and Sprinter Vans are 12% of weekly gross. How can we keep your truck loaded today?`;
    speakAgentText(
      sampleLine,
      selectedVoice,
      () => setIsAgentSpeaking(true),
      () => setIsAgentSpeaking(false)
    );
  };

  // Copy Full Transcript
  const handleCopyTranscript = () => {
    const textToCopy = transcript
      .map((t) => `[${t.time}] ${t.speaker === 'agent' ? 'Sarah (AI Agent)' : currentContact?.name || 'Driver'}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // End Call Handler
  const endCall = (finalOutcome?: CallLog['outcome'], summaryText?: string) => {
    stopPhoneRing();
    stopSpeaking();
    setIsAgentSpeaking(false);
    playCallEndSound();

    const finalDuration = callDuration;
    const outcome = finalOutcome || (leadScore >= 80 ? 'Qualified - Setup Website' : leadScore <= 30 ? 'Not Interested' : 'Follow-up Scheduled');

    const newLog: CallLog = {
      id: 'log-' + Date.now(),
      contactId: currentContact?.id || '',
      contactName: currentContact?.name || 'Owner Operator',
      mobile: currentContact?.mobile || '',
      startTime: new Date(Date.now() - finalDuration * 1000).toISOString(),
      durationSeconds: finalDuration,
      outcome,
      qualificationScore: leadScore,
      transcript,
      transferredToRep: outcome === 'Transferred to Rep',
      repName: outcome === 'Transferred to Rep' ? scriptConfig.humanRepName : undefined,
      recordingId: 'REC-' + Math.floor(100000 + Math.random() * 900000),
      complianceChecked: true,
      summary: summaryText || (qualificationTags.isSelfDispatching ? `Lead verified ${qualificationTags.equipment || currentContact?.equipmentType} at ${qualificationTags.quotedFee || '7%'}.` : 'Cold call outreach completed.'),
      equipmentType: qualificationTags.equipment || currentContact?.equipmentType || 'Dry Van',
      quotedFeePercentage: qualificationTags.quotedFee || EQUIPMENT_RATES[currentContact?.equipmentType || 'Dry Van']?.rateText,
    };

    onSaveCallLog(newLog);

    onUpdateContact({
      ...currentContact,
      status: outcome === 'Transferred to Rep' ? 'Transferred' : outcome === 'Qualified - Setup Website' ? 'Qualified' : 'Pending',
      lastCallTimestamp: new Date().toISOString(),
      callNotes: newLog.summary,
      equipmentType: (qualificationTags.equipment as any) || currentContact?.equipmentType,
      qualificationData: {
        isSelfDispatching: qualificationTags.isSelfDispatching,
        equipmentConfirmed: qualificationTags.equipment || currentContact?.equipmentType,
        quotedRate: qualificationTags.quotedFee,
        setupPreference: (qualificationTags.setupPreference as any) || 'Undecided',
        leadScore,
      },
    });

    setCallState('ended');

    // Auto-advance if sequential dialer active
    if (isAutoDialerActive && currentContactIndex < contacts.length - 1) {
      setTimeout(() => {
        const nextIdx = currentContactIndex + 1;
        setCurrentContactIndex(nextIdx);
        initiateCall(contacts[nextIdx]);
      }, dialDelaySeconds * 1000);
    } else if (isAutoDialerActive) {
      setIsAutoDialerActive(false);
    }
  };

  // Submit Driver Response to Gemini NLP Qualification Engine
  const handleDriverStatement = async (statementText: string) => {
    const trimmed = statementText.trim();
    if (!trimmed || callState !== 'connected') return;

    setLeadSpeechInput('');
    stopSpeaking();

    const timestamp = formatTime(callDuration);
    const newHistory = [...transcript, { speaker: 'lead' as const, text: trimmed, time: timestamp }];
    setTranscript(newHistory);

    try {
      setIsAgentSpeaking(true);

      const res = await fetch('/api/gemini/call-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: currentContact,
          history: newHistory,
          leadSpeech: trimmed,
          callDurationSeconds: callDuration,
        }),
      });

      const data = await res.json();
      setIsAgentSpeaking(false);

      if (data.replyText) {
        const agentReplyTime = formatTime(callDuration + 1);
        setTranscript((prev) => [...prev, { speaker: 'agent', text: data.replyText, time: agentReplyTime }]);

        if (data.leadScore !== undefined) {
          setLeadScore(data.leadScore);
        }

        if (data.detectedEquipment) {
          setQualificationTags((prev) => ({
            ...prev,
            equipment: data.detectedEquipment,
            quotedFee: data.quotedFee || prev.quotedFee,
          }));
        }

        if (data.quotedFee) {
          setQualificationTags((prev) => ({ ...prev, quotedFee: data.quotedFee }));
        }

        if (data.isSelfDispatching !== undefined) {
          setQualificationTags((prev) => ({ ...prev, isSelfDispatching: data.isSelfDispatching }));
        }

        if (data.setupPreference) {
          setQualificationTags((prev) => ({ ...prev, setupPreference: data.setupPreference }));
        }

        if (data.objectionDetected) {
          setQualificationTags((prev) => ({ ...prev, objection: data.objectionDetected }));
        }

        // Spoken audio playback in Nice Lady Voice
        if (!voiceMuted) {
          speakAgentText(
            data.replyText,
            selectedVoice,
            () => setIsAgentSpeaking(true),
            () => setIsAgentSpeaking(false)
          );
        }

        // Check if customer agreed and should trigger warm transfer to human rep
        if (data.shouldTransfer) {
          playTransferChime();
          setIsManualIntercept(false);
          setTimeout(() => {
            setTransferModalOpen(true);
          }, 1800);
        } else if (data.outcome === 'DNC' || data.outcome === 'Not Interested') {
          setTimeout(() => {
            endCall(data.outcome, `Driver requested DNC/not interested. Honored TCPA compliance.`);
          }, 4500);
        }
      }
    } catch (err) {
      setIsAgentSpeaking(false);
      console.error('Call turn error', err);
    }
  };

  // Microphone toggle for testing
  const toggleMicrophone = () => {
    if (isMicListening) {
      speechRecognizerRef.current?.stop();
      setIsMicListening(false);
    } else {
      speechRecognizerRef.current = createSpeechRecognizer(
        (recognizedText) => {
          handleDriverStatement(recognizedText);
        },
        (err) => {
          console.warn('Speech error', err);
          setIsMicListening(false);
        },
        () => {
          setIsMicListening(false);
        }
      );
      speechRecognizerRef.current.start();
      setIsMicListening(true);
    }
  };

  // Simulate Realistic Driver Response using Gemini
  const handleSimulateDriverReply = async (presetType: 'interested' | 'skeptical' | 'busy' | 'not_interested') => {
    setIsAiSimulating(true);
    try {
      const lastAgentTurn = transcript.filter((t) => t.speaker === 'agent').slice(-1)[0]?.text || '';
      const res = await fetch('/api/gemini/simulate-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: presetType,
          agentStatement: lastAgentTurn,
          conversationHistory: transcript,
          contact: currentContact,
        }),
      });
      const data = await res.json();
      if (data.text) {
        handleDriverStatement(data.text);
      }
    } catch (e) {
      handleDriverStatement("Yeah, I'm booking my own loads right now. What's your rate for a Dry Van?");
    } finally {
      setIsAiSimulating(false);
    }
  };

  // Handle Warm Transfer Complete
  const handleCompleteTransfer = (closingNotes: string) => {
    setTransferModalOpen(false);
    endCall('Transferred to Rep', closingNotes);
  };

  // Current active equipment highlighted in schedule
  const activeEquip = qualificationTags.equipment || currentContact?.equipmentType || 'Dry Van';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Sequential Dialer Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isAutoDialerActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
            <PhoneCall className={`w-6 h-6 ${callState === 'connected' ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Outbound Dispatch Dialer</h2>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                callState === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                callState === 'ringing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                callState === 'dialing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {callState.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact <strong className="text-white">{currentContactIndex + 1}</strong> of <strong className="text-white">{contacts.length}</strong>: {currentContact?.name} ({currentContact?.companyName})
            </p>
          </div>
        </div>

        {/* Dialer controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Direct Dial Button */}
          <button
            onClick={() => setIsDirectDialModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all border border-blue-400/30"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
            <span>Dial Lead Number Now</span>
          </button>

          {/* Voice Mute Toggle */}
          <button
            onClick={() => {
              if (!voiceMuted) stopSpeaking();
              setVoiceMuted(!voiceMuted);
            }}
            title={voiceMuted ? 'Unmute Agent Spoken Audio' : 'Mute Agent Spoken Audio'}
            className={`p-2.5 rounded-xl border transition-all ${
              voiceMuted ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Previous / Next Contact buttons */}
          <button
            disabled={currentContactIndex === 0 || callState === 'connected'}
            onClick={() => {
              setCurrentContactIndex((prev) => Math.max(0, prev - 1));
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 border border-slate-700"
          >
            Prev
          </button>

          <button
            disabled={currentContactIndex >= contacts.length - 1 || callState === 'connected'}
            onClick={() => {
              setCurrentContactIndex((prev) => Math.min(contacts.length - 1, prev + 1));
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 border border-slate-700"
          >
            <span>Next</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Sequential Auto-Dial Toggle */}
          <button
            onClick={() => {
              const nextState = !isAutoDialerActive;
              setIsAutoDialerActive(nextState);
              if (nextState && callState === 'idle') {
                initiateCall(currentContact);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isAutoDialerActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isAutoDialerActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Auto-Dialer</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Dial Queue</span>
              </>
            )}
          </button>

          {/* Dial Now / Hang Up Button */}
          {callState === 'idle' || callState === 'ended' ? (
            <button
              onClick={() => initiateCall(currentContact)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial Contact</span>
            </button>
          ) : (
            <button
              onClick={() => endCall()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          )}
        </div>
      </div>

      {/* MANDATORY EQUIPMENT RATE SCHEDULE STRIP */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>Nexora Standard Equipment Rate Schedule (Quoted Automatically by AI Agent):</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Agent verifies equipment with driver and applies exact rate
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Sprinter Van / Cargo Van */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Sprinter Van/Cargo Van'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Sprinter / Cargo Van</div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">12%</div>
            <div className="text-[10px] text-slate-400">of weekly Gross</div>
          </div>

          {/* Box Truck */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Box truck'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Box Truck</div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">10%</div>
            <div className="text-[10px] text-slate-400">of weekly Gross</div>
          </div>

          {/* Dry Van */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Dry Van'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Dry Van</div>
            <div className="text-sm font-extrabold text-blue-400 mt-0.5">7%</div>
            <div className="text-[10px] text-slate-400">per load flat</div>
          </div>

          {/* Reefer */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Reefer'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Reefer</div>
            <div className="text-sm font-extrabold text-cyan-400 mt-0.5">6%</div>
            <div className="text-[10px] text-slate-400">lowest rate</div>
          </div>

          {/* Hotshot */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Hotshot'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Hotshot</div>
            <div className="text-sm font-extrabold text-amber-400 mt-0.5">10%</div>
            <div className="text-[10px] text-slate-400">partials & LTL</div>
          </div>

          {/* Flatbed */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeEquip === 'Flatbed' || activeEquip === 'Step Deck'
              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Flatbed / Step Deck</div>
            <div className="text-sm font-extrabold text-indigo-400 mt-0.5">10%</div>
            <div className="text-[10px] text-slate-400">open deck freight</div>
          </div>
        </div>
      </div>

      {/* NICE LADY VOICE SELECTOR & AMERICAN PRONUNCIATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-[10px]">
            👩
          </div>
          <span className="font-semibold text-white">AI Voice Persona:</span>
          <span className="text-pink-300 font-medium">Nice American Lady Voice (Sarah)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {AMERICAN_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.geminiVoice)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedVoice === v.geminiVoice
                    ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v.geminiVoice === 'Kore'
                  ? '👩 Sarah (Nice Lady Voice - Kore)'
                  : v.geminiVoice === 'Aoede'
                  ? '👩 Emma (Lady Voice - Aoede)'
                  : v.geminiVoice === 'Puck'
                  ? '👨 Sam Ross (Puck)'
                  : '👨 Mike (Fenrir)'}
              </button>
            ))}
          </div>

          <button
            onClick={handleTestLadyVoice}
            disabled={callState === 'connected'}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900/60 text-pink-200 border border-pink-700/50 text-[11px] font-bold disabled:opacity-40"
          >
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Test Lady Voice</span>
          </button>
        </div>
      </div>

      {/* Main Calling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lead Dossier & Call Telephony (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Contact Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Target Trucking Lead #{currentContactIndex + 1}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{currentContact?.name}</h3>
                <p className="text-xs text-slate-300 font-medium">{currentContact?.companyName}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                currentContact?.status === 'Transferred' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                currentContact?.status === 'Qualified' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                currentContact?.status === 'In Call' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {currentContact?.status}
              </span>
            </div>

            {/* Spec Details Table */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Mobile Phone</span>
                <span className="font-semibold text-emerald-400 font-mono text-sm">{currentContact?.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">FMCSA Authority</span>
                <span className="font-mono text-slate-200 font-semibold">{currentContact?.mcNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Confirmed Equipment</span>
                <span className="font-semibold text-emerald-300">{activeEquip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Applicable Fee %</span>
                <span className="font-bold text-amber-300">{EQUIPMENT_RATES[activeEquip]?.rateText || '7%'}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase">Preferred Lanes</span>
                <span className="font-medium text-slate-300">{currentContact?.preferredLanes}</span>
              </div>
            </div>

            {/* LIVE OPERATOR TAKEOVER BAR */}
            {callState === 'connected' && (
              <div className="bg-gradient-to-r from-amber-950/80 via-rose-950/70 to-slate-900 border-2 border-amber-500/60 rounded-xl p-3.5 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-bold text-amber-300">Live Operator Takeover</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Halt Sarah & Speak with Driver</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStopAgentAndForwardToMe}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-900/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <PhoneForwarded className="w-4 h-4 animate-pulse" />
                    <span>Stop AI & Forward Call to Me</span>
                  </button>

                  <button
                    onClick={handleSilenceAgent}
                    title="Silence AI Speech Immediately"
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-medium flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span className="hidden sm:inline">Silence</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Audio Wave Visualizer & Status */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 text-center space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Call Duration</span>
                </span>
                <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-0.5 rounded">
                  {formatTime(callDuration)}
                </span>
              </div>

              {/* Dynamic Sound Wave */}
              <div className="h-16 flex items-center justify-center gap-1 bg-slate-900/60 rounded-lg px-4 border border-slate-800">
                {callState === 'connected' ? (
                  [40, 65, 85, 30, 95, 50, 75, 45, 90, 60, 35, 70, 80, 55, 40].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isAgentSpeaking
                          ? 'bg-pink-400 animate-pulse'
                          : isMicListening
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height: isAgentSpeaking || isMicListening ? `${Math.max(12, (height * (i % 2 === 0 ? 0.9 : 1.1)))}%` : '15%',
                      }}
                    />
                  ))
                ) : callState === 'ringing' ? (
                  <div className="text-xs text-amber-400 animate-pulse font-mono font-medium">
                    🔔 Ringing recipient telephone line...
                  </div>
                ) : callState === 'dialing' ? (
                  <div className="text-xs text-blue-400 animate-pulse font-mono font-medium">
                    ⚡ Dialing MC Carrier database...
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-mono">
                    Ready to initiate call outreach
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isAgentSpeaking ? 'bg-pink-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className={isAgentSpeaking ? 'text-pink-300 font-medium' : 'text-slate-400'}>
                    {isAgentSpeaking ? `Sarah Speaking (American Lady Voice)...` : 'Sarah Listening'}
                  </span>
                </div>
                {callState === 'connected' && (
                  <button
                    onClick={handleStopAgentAndForwardToMe}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Take Over Call</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Lead Qualification Meter */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  NLP Lead Qualification & Equipment Quota
                </span>
                <span className={`font-bold font-mono text-sm ${
                  leadScore >= 80 ? 'text-emerald-400' : leadScore >= 50 ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {leadScore} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    leadScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    leadScore >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, leadScore))}%` }}
                />
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  qualificationTags.isSelfDispatching
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  Self-Dispatching: {qualificationTags.isSelfDispatching ? 'Yes (Books own)' : 'Pending'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {activeEquip}: {EQUIPMENT_RATES[activeEquip]?.rateText || '7%'} Quoted
                </span>
                {qualificationTags.setupPreference && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Prefers {qualificationTags.setupPreference} Setup
                  </span>
                )}
                {qualificationTags.objection && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Objection: {qualificationTags.objection}
                  </span>
                )}
              </div>
            </div>

            {/* Compliance Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{complianceNotice}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prominent Live Transcription & Driver Testing Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Transcript Box with Prominent Speaker Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col shadow-xl overflow-hidden min-h-[420px] max-h-[540px]">
            {/* Transcript Header with Copy Button */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <span className="font-bold text-white">Live Call Transcription (AI Agent & Driver)</span>
                <span className="text-slate-400 text-[11px]">({transcript.length} speech turns)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyTranscript}
                  disabled={transcript.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] disabled:opacity-40 transition-colors"
                >
                  {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copiedTranscript ? 'Copied!' : 'Copy Transcript'}</span>
                </button>
              </div>
            </div>

            {/* Live Status Indicators */}
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 font-medium text-pink-300">
                  <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Sarah (Nice Lady Voice)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> {currentContact?.name} (Caller)
                </span>
              </div>
              <div className="text-amber-300 font-medium">
                Equipment: {activeEquip} ({EQUIPMENT_RATES[activeEquip]?.rateText || '7%'})
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <PhoneCall className="w-8 h-8 text-pink-400 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-200">No active conversation yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Click <strong>"Dial Contact"</strong> or <strong>"Dial Lead Number Now"</strong>. Sarah will start the cold call in her nice American lady voice, ask about their equipment type, and tell them the exact matching percentage fee.
                  </p>
                </div>
              ) : (
                transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      {msg.speaker === 'agent' ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center text-[10px]">
                            👩
                          </div>
                          <span className="font-bold text-pink-300">Sarah (AI Agent - Nice Lady Voice)</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-emerald-300">{currentContact?.name} (Driver)</span>
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        </>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono ml-1">{msg.time}</span>
                    </div>

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${
                        msg.speaker === 'agent'
                          ? 'bg-slate-900 text-slate-100 rounded-tl-sm border border-pink-500/30 shadow-pink-950/20'
                          : 'bg-emerald-950/70 text-emerald-100 rounded-tr-sm border border-emerald-500/40 shadow-emerald-950/20'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Interactive Driver Testing Controls (Equipment Presets, Mic, Text) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Test Driver Equipment Statements (Click to Test Rate Response):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Sarah will reply quoting the exact % rate
              </span>
            </div>

            {/* Quick Trucker Equipment Statement Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I drive a Sprinter Van. How much do you charge for cargo vans?")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-600/40 disabled:opacity-40 transition-colors"
              >
                🚐 "I drive a Sprinter Van" (Test 12%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I run a 26 foot Box Truck. What is your dispatch percentage?")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-600/40 disabled:opacity-40 transition-colors"
              >
                📦 "I run a Box Truck" (Test 10%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I pull a 53ft Dry Van booking my own loads.")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-600/40 disabled:opacity-40 transition-colors"
              >
                🚚 "I pull a Dry Van" (Test 7%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I'm running a 53ft Reefer trailer.")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-600/40 disabled:opacity-40 transition-colors"
              >
                ❄️ "I pull a Reefer" (Test 6%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I have a 40ft Hotshot rig.")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-600/40 disabled:opacity-40 transition-colors"
              >
                ⚡ "I have a Hotshot" (Test 10%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("I run a 48ft Flatbed open deck.")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-600/40 disabled:opacity-40 transition-colors"
              >
                🏗️ "I pull a Flatbed" (Test 10%)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("That sounds fair. Let's do it by phone right now.")}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 shadow-sm"
              >
                📞 "I agree, set up by phone" (Transfer)
              </button>

              <button
                disabled={callState !== 'connected'}
                onClick={() => handleDriverStatement("Not interested, please put me on your DNC list.")}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-700/40 disabled:opacity-40"
              >
                ⛔ "Not interested (DNC)"
              </button>

              {/* Gemini Auto-Simulator Button */}
              <button
                disabled={callState !== 'connected' || isAiSimulating}
                onClick={() => handleSimulateDriverReply('interested')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1 disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>{isAiSimulating ? 'Simulating...' : 'Gemini Auto-Driver'}</span>
              </button>
            </div>

            {/* Custom Input / Mic Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDriverStatement(leadSpeechInput);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <button
                type="button"
                disabled={callState !== 'connected'}
                onClick={toggleMicrophone}
                title="Speak using your microphone as the trucker"
                className={`p-2.5 rounded-xl border transition-all ${
                  isMicListening
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 disabled:opacity-40'
                }`}
              >
                {isMicListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                disabled={callState !== 'connected'}
                value={leadSpeechInput}
                onChange={(e) => setLeadSpeechInput(e.target.value)}
                placeholder={
                  callState === 'connected'
                    ? "Type driver's response (e.g. 'I drive a Sprinter Van' or use mic / buttons above)..."
                    : "Connect call to speak with Sarah..."
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={callState !== 'connected' || !leadSpeechInput.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DIRECT DIAL MODAL: Enter a number directly to create a sale */}
      {isDirectDialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900/60 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Number Dial Now</h3>
                  <p className="text-[11px] text-slate-400">Add a prospective lead and call immediately to create a sale</p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectDialModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectDialSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Direct Mobile / Phone Number *</span>
                  <span className="text-emerald-400 text-[10px]">US / Canadian Carrier</span>
                </label>
                <input
                  required
                  type="text"
                  value={directNumber}
                  onChange={(e) => setDirectNumber(e.target.value)}
                  placeholder="e.g. +1 (407) 555-0199 or 4075550199"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Contact Name</label>
                  <input
                    type="text"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    placeholder="e.g. Alex Henderson"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={directCompany}
                    onChange={(e) => setDirectCompany(e.target.value)}
                    placeholder="e.g. Henderson Transport LLC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Equipment Type</label>
                  <select
                    value={directEquip}
                    onChange={(e) => setDirectEquip(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Sprinter Van/Cargo Van">Sprinter Van / Cargo Van (12%)</option>
                    <option value="Box truck">Box Truck (10%)</option>
                    <option value="Dry Van">Dry Van (7%)</option>
                    <option value="Reefer">Reefer (6%)</option>
                    <option value="Hotshot">Hotshot (10%)</option>
                    <option value="Flatbed">Flatbed (10%)</option>
                    <option value="Step Deck">Step Deck (10%)</option>
                    <option value="Power Only">Power Only (8%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">MC Number</label>
                  <input
                    type="text"
                    value={directMc}
                    onChange={(e) => setDirectMc(e.target.value)}
                    placeholder="MC-987654"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Preferred Lanes</label>
                <input
                  type="text"
                  value={directLanes}
                  onChange={(e) => setDirectLanes(e.target.value)}
                  placeholder="e.g. TX to Midwest / FL Regional"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Sarah will call with her nice lady voice, ask about their equipment, and quote the exact rate ({EQUIPMENT_RATES[directEquip]?.rateText || '7%'}).</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDirectDialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!directNumber.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Dial Now & Create Sale</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warm Transfer / Live Intercept Modal */}
      {transferModalOpen && currentContact && (
        <WarmTransferModal
          contact={currentContact}
          leadNotes={`Lead confirmed self-dispatching and verified ${activeEquip} equipment at ${EQUIPMENT_RATES[activeEquip]?.rateText || '7%'}. Customer agreed to phone onboarding and requested immediate load availability for ${currentContact.preferredLanes}.`}
          leadScore={leadScore}
          transcriptCount={transcript.length}
          isManualIntercept={isManualIntercept}
          onCompleteTransfer={handleCompleteTransfer}
          onCancelTransfer={() => {
            setTransferModalOpen(false);
            setIsManualIntercept(false);
          }}
        />
      )}
    </div>
  );
};
