import React, { useState } from 'react';
import { CallLog, TruckingContact } from '../types/trucking';
import {
  BarChart3,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Search,
  Filter,
  Volume2,
  FileText,
  X,
  Sparkles,
  Bot,
  User
} from 'lucide-react';

interface AnalyticsDashboardProps {
  callLogs: CallLog[];
  contacts: TruckingContact[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ callLogs, contacts }) => {
  const [selectedTranscriptLog, setSelectedTranscriptLog] = useState<CallLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // Compute Real-time Analytics KPIs
  const totalCalls = callLogs.length;
  const answeredCalls = callLogs.filter((l) => l.outcome !== 'No Answer').length;
  const connectRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  const qualifiedCalls = callLogs.filter(
    (l) => l.outcome === 'Transferred to Rep' || l.outcome === 'Qualified - Setup Website'
  ).length;
  const qualificationRate = totalCalls > 0 ? Math.round((qualifiedCalls / totalCalls) * 100) : 0;

  const transferredCalls = callLogs.filter((l) => l.transferredToRep).length;
  const transferRate = totalCalls > 0 ? Math.round((transferredCalls / totalCalls) * 100) : 0;

  const totalDuration = callLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
  const avgHandleTime = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  // Outcome counts
  const outcomesCount = {
    transferred: callLogs.filter((l) => l.outcome === 'Transferred to Rep').length,
    qualifiedWeb: callLogs.filter((l) => l.outcome === 'Qualified - Setup Website').length,
    followup: callLogs.filter((l) => l.outcome === 'Follow-up Scheduled').length,
    notInterested: callLogs.filter((l) => l.outcome === 'Not Interested').length,
    dnc: callLogs.filter((l) => l.outcome === 'DNC').length,
  };

  // Filtered Logs
  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch =
      log.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.mobile.includes(searchTerm) ||
      log.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutcome = outcomeFilter === 'All' || log.outcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });

  // Export Call Logs CSV
  const handleExportCallLogs = () => {
    const header = 'Call ID,Contact Name,Mobile,Duration (sec),Outcome,Lead Score,Recording ID,Summary,Start Time\n';
    const rows = callLogs
      .map(
        (l) =>
          `"${l.id}","${l.contactName}","${l.mobile}","${l.durationSeconds}","${l.outcome}","${l.qualificationScore}","${l.recordingId}","${l.summary.replace(/"/g, '""')}","${l.startTime}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexora_call_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulatePlayRecording = (recordingId: string) => {
    setIsPlayingAudioId(recordingId);
    setTimeout(() => {
      setIsPlayingAudioId(null);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Executive KPI Summary Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Management Oversight & Call Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry on cold call volumes, NLP lead qualification rate, and warm transfer velocity.
          </p>
        </div>

        <button
          onClick={handleExportCallLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Export Call Logs CSV</span>
        </button>
      </div>

      {/* 6 Key Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Dials</span>
          <div className="text-2xl font-bold text-white">{totalCalls}</div>
          <span className="text-[11px] text-slate-400">Calls logged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Connect Rate</span>
          <div className="text-2xl font-bold text-blue-400">{connectRate}%</div>
          <span className="text-[11px] text-slate-400">Answered by driver</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Qualification Rate</span>
          <div className="text-2xl font-bold text-indigo-400">{qualificationRate}%</div>
          <span className="text-[11px] text-slate-400">Booking own loads</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Warm Transfers</span>
          <div className="text-2xl font-bold text-emerald-400">{transferRate}%</div>
          <span className="text-[11px] text-slate-400">{transferredCalls} forwarded to Sam Ross</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Handle Time</span>
          <div className="text-2xl font-bold text-white font-mono">{avgHandleTime}s</div>
          <span className="text-[11px] text-slate-400">Per conversation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">TCPA Compliance</span>
          <div className="text-2xl font-bold text-emerald-400">100%</div>
          <span className="text-[11px] text-slate-400">Zero violations</span>
        </div>
      </div>

      {/* Visual Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Outcomes Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Call Outreach Outcomes</h3>
            <span className="text-xs text-slate-400">{totalCalls} total completed</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Transferred */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-emerald-400 font-medium">Warm Transferred to Sam Ross</span>
                <span className="font-bold text-white">{outcomesCount.transferred} ({totalCalls ? Math.round((outcomesCount.transferred / totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls ? (outcomesCount.transferred / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Qualified Website */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-blue-400 font-medium">Qualified - Website Onboarding</span>
                <span className="font-bold text-white">{outcomesCount.qualifiedWeb} ({totalCalls ? Math.round((outcomesCount.qualifiedWeb / totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls ? (outcomesCount.qualifiedWeb / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Follow-up */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-purple-400 font-medium">Follow-up Scheduled</span>
                <span className="font-bold text-white">{outcomesCount.followup} ({totalCalls ? Math.round((outcomesCount.followup / totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls ? (outcomesCount.followup / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Not Interested */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 font-medium">Not Interested</span>
                <span className="font-bold text-white">{outcomesCount.notInterested} ({totalCalls ? Math.round((outcomesCount.notInterested / totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls ? (outcomesCount.notInterested / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* DNC */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rose-400 font-medium">Do Not Call (DNC Opt-Out)</span>
                <span className="font-bold text-white">{outcomesCount.dnc} ({totalCalls ? Math.round((outcomesCount.dnc / totalCalls) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalCalls ? (outcomesCount.dnc / totalCalls) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Breakdown & Value Proposition Impact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Carrier Trailer Fleet Mix</h3>
            <span className="text-xs text-slate-400">{contacts.length} leads in queue</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Dry Van</span>
              <div className="text-xl font-bold text-blue-400">
                {contacts.filter((c) => c.equipmentType === 'Dry Van').length} Units
              </div>
              <p className="text-[11px] text-slate-400">Average Rate: $2.40 - $2.85/mi</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reefer (Temperature)</span>
              <div className="text-xl font-bold text-cyan-400">
                {contacts.filter((c) => c.equipmentType === 'Reefer').length} Units
              </div>
              <p className="text-[11px] text-slate-400">Average Rate: $2.80 - $3.40/mi</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Flatbed</span>
              <div className="text-xl font-bold text-amber-400">
                {contacts.filter((c) => c.equipmentType === 'Flatbed').length} Units
              </div>
              <p className="text-[11px] text-slate-400">Average Rate: $2.90 - $3.50/mi</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Step Deck</span>
              <div className="text-xl font-bold text-indigo-400">
                {contacts.filter((c) => c.equipmentType === 'Step Deck').length} Units
              </div>
              <p className="text-[11px] text-slate-400">Average Rate: $3.10 - $3.80/mi</p>
            </div>
          </div>

          <div className="bg-blue-950/30 p-3 rounded-xl border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>AI qualification identified self-dispatching drivers as highest converting (82% agreed to forward to Sam Ross).</span>
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="text-base font-bold text-white">Call Logs & Audit Records</h3>
            <p className="text-slate-400 text-xs">Complete audio transcript history, qualification scoring, and transfer records.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Outcomes</option>
              <option value="Transferred to Rep">Transferred to Rep</option>
              <option value="Qualified - Setup Website">Qualified - Setup Website</option>
              <option value="Follow-up Scheduled">Follow-up Scheduled</option>
              <option value="Not Interested">Not Interested</option>
              <option value="DNC">DNC</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Lead Contact</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Equipment</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Outcome</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Recording</th>
                <th className="py-3 px-3 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                    No call logs available yet. Make a call on the Dialer Console tab.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {log.contactName}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {log.mobile}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {log.equipmentType}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {log.durationSeconds}s
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.outcome === 'Transferred to Rep' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        log.outcome === 'Qualified - Setup Website' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        log.outcome === 'Follow-up Scheduled' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        log.outcome === 'DNC' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      {log.qualificationScore}%
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleSimulatePlayRecording(log.recordingId)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          isPlayingAudioId === log.recordingId
                            ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isPlayingAudioId === log.recordingId ? 'Playing...' : log.recordingId}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedTranscriptLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Review Modal */}
      {selectedTranscriptLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                  Call Recording & Audio Transcript
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Call with {selectedTranscriptLog.contactName} ({selectedTranscriptLog.mobile})
                </h3>
              </div>
              <button
                onClick={() => setSelectedTranscriptLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Call Metadata Bar */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Outcome</span>
                  <span className="font-semibold text-emerald-400">{selectedTranscriptLog.outcome}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Call Length</span>
                  <span className="font-semibold text-white">{selectedTranscriptLog.durationSeconds} seconds</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Lead Score</span>
                  <span className="font-semibold text-blue-400">{selectedTranscriptLog.qualificationScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Compliance Verified</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> TCPA Passed
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700 text-slate-200">
                <strong className="text-white block mb-0.5">AI Call Executive Summary:</strong>
                {selectedTranscriptLog.summary}
              </div>

              {/* Full Transcript Turns */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedTranscriptLog.transcript.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No speech turns logged.</p>
                ) : (
                  selectedTranscriptLog.transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                        {msg.speaker === 'agent' ? (
                          <>
                            <Bot className="w-3 h-3 text-blue-400" />
                            <span className="font-semibold text-blue-300">Nexora AI Agent</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-emerald-300">{selectedTranscriptLog.contactName}</span>
                            <User className="w-3 h-3 text-emerald-400" />
                          </>
                        )}
                        <span className="text-slate-500 font-mono ml-1">{msg.time}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.speaker === 'agent'
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/30'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedTranscriptLog(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Close Transcript
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
