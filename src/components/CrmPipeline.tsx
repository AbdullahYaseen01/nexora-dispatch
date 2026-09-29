import React, { useState } from 'react';
import { TruckingContact, CallLog } from '../types/trucking';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  UserCheck,
  FileCheck,
  ShieldAlert,
  Clock,
  Send,
  Sparkles,
  X,
  FileText
} from 'lucide-react';

interface CrmPipelineProps {
  contacts: TruckingContact[];
  callLogs: CallLog[];
  onUpdateContactStatus: (contactId: string, newStatus: TruckingContact['status']) => void;
  onSelectContactForDial: (contact: TruckingContact) => void;
}

export const CrmPipeline: React.FC<CrmPipelineProps> = ({
  contacts,
  callLogs,
  onUpdateContactStatus,
  onSelectContactForDial,
}) => {
  const [selectedContact, setSelectedContact] = useState<TruckingContact | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Group contacts by CRM pipeline stages
  const stages = [
    { id: 'Pending', label: 'New CSV Ingest', color: 'border-slate-700 bg-slate-900/80', badge: 'bg-slate-800 text-slate-300' },
    { id: 'In Call', label: 'Active Outreach', color: 'border-blue-500/30 bg-blue-950/20', badge: 'bg-blue-500/20 text-blue-300' },
    { id: 'Qualified', label: 'AI Lead Qualified', color: 'border-indigo-500/30 bg-indigo-950/20', badge: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'Transferred', label: 'Transferred to Sam Ross', color: 'border-emerald-500/40 bg-emerald-950/20', badge: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'Follow-up', label: 'Follow-up Scheduled', color: 'border-purple-500/30 bg-purple-950/20', badge: 'bg-purple-500/20 text-purple-300' },
    { id: 'DNC', label: 'DNC / Opt-Out', color: 'border-rose-500/30 bg-rose-950/20', badge: 'bg-rose-500/20 text-rose-300' },
  ];

  // Direct CRM Sync Execution
  const handlePushToCrm = async (destination: string) => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const res = await fetch('/api/crm/sync-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          payload: contacts.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.mobile,
            company: c.companyName,
            mc: c.mcNumber,
            equipment: c.equipmentType,
            lanes: c.preferredLanes,
            status: c.status,
            leadScore: c.qualificationData?.leadScore || 0,
            lastCall: c.lastCallTimestamp,
          })),
        }),
      });

      const data = await res.json();
      setSyncStatusMessage(`Successfully synced ${contacts.length} leads directly to ${destination} (Sync ID: ${data.syncId})`);
    } catch (err: any) {
      setSyncStatusMessage('CRM sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* CRM Overview Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Direct CRM Pipeline & Lead Stages</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated lead qualification pipeline syncing owner-operator records directly to your freight dispatch CRM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            disabled={isSyncing}
            onClick={() => handlePushToCrm('HubSpot Freight CRM')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync to HubSpot</span>
          </button>

          <button
            disabled={isSyncing}
            onClick={() => handlePushToCrm('Salesforce Transportation CRM')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync to Salesforce</span>
          </button>
        </div>
      </div>

      {syncStatusMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatusMessage}</span>
          </div>
          <button onClick={() => setSyncStatusMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageContacts = contacts.filter((c) =>
            stage.id === 'In Call' ? c.status === 'In Call' || c.status === 'Ringing' : c.status === stage.id
          );

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border p-3 flex flex-col min-h-[480px] shadow-lg ${stage.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white">{stage.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>
                  {stageContacts.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 py-3 space-y-2.5 overflow-y-auto">
                {stageContacts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[11px]">
                    No leads in this stage
                  </div>
                ) : (
                  stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="bg-slate-900 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{contact.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{contact.companyName}</div>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-emerald-400">
                          {contact.mcNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="bg-slate-950 px-1.5 py-0.5 rounded text-blue-300 font-medium text-[10px]">
                          {contact.equipmentType}
                        </span>
                        {contact.qualificationData?.leadScore !== undefined && (
                          <span className={`text-[10px] font-mono font-bold ${
                            contact.qualificationData.leadScore >= 80 ? 'text-emerald-400' : 'text-blue-400'
                          }`}>
                            Score: {contact.qualificationData.leadScore}%
                          </span>
                        )}
                      </div>

                      {contact.callNotes && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 bg-slate-950/60 p-1.5 rounded">
                          {contact.callNotes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                          {contact.preferredLanes}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContactForDial(contact);
                          }}
                          title="Call Lead Now"
                          className="p-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Lead Drawer Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                  Lead Profile & CRM Record
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedContact.name}</h3>
                <p className="text-xs text-slate-400">{selectedContact.companyName}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Carrier Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Direct Phone</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedContact.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">FMCSA Authority</span>
                  <span className="font-mono text-white font-semibold">{selectedContact.mcNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Trailer Type</span>
                  <span className="font-semibold text-blue-300">{selectedContact.equipmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Fleet Size</span>
                  <span className="font-semibold text-white">{selectedContact.truckCount} Power Unit</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Preferred Lanes</span>
                  <span className="text-slate-200">{selectedContact.preferredLanes}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Update CRM Pipeline Stage:</label>
                <div className="grid grid-cols-3 gap-2">
                  {stages.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        onUpdateContactStatus(selectedContact.id, st.id as any);
                        setSelectedContact({ ...selectedContact, status: st.id as any });
                      }}
                      className={`p-2 rounded-xl text-[11px] font-semibold text-center border transition-all ${
                        selectedContact.status === st.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call History & Recordings for this Contact */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Call Outreach Logs & Transcripts
                </span>

                {callLogs.filter((l) => l.contactId === selectedContact.id).length === 0 ? (
                  <p className="text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    No calls placed to this lead yet. Click "Start Call Now" below to initiate dialing.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {callLogs
                      .filter((l) => l.contactId === selectedContact.id)
                      .map((log) => (
                        <div key={log.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-emerald-400">{log.outcome}</span>
                            <span className="text-slate-400 font-mono">{log.durationSeconds}s</span>
                          </div>
                          <p className="text-slate-300">{log.summary}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-slate-400 text-[11px]">Nexora Dispatch Solution LLC</span>
                <button
                  onClick={() => {
                    const c = selectedContact;
                    setSelectedContact(null);
                    onSelectContactForDial(c);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Call Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
