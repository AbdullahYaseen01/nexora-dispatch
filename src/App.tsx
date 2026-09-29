/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TruckingContact, CallLog, ScriptConfig } from './types/trucking';
import { Header } from './components/Header';
import { DialerConsole } from './components/DialerConsole';
import { ContactManager } from './components/ContactManager';
import { CrmPipeline } from './components/CrmPipeline';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ScriptFeedbackLoop } from './components/ScriptFeedbackLoop';

const defaultScriptConfig: ScriptConfig = {
  companyName: 'Nexora Dispatch Solution LLC',
  agentIdentity: 'AI Agent for Sam Ross',
  repPhone: '+1 (407) 283-7737',
  humanRepName: 'Sam Ross (Senior Dispatch Specialist)',
  websiteUrl: 'https://nexoradispatch.com/setup',
  commissionRate: '7% flat per load (no forced dispatch, no hidden fees)',
  primaryPitch: `Hi [Name], this is AI Agent for Sam Ross from Nexora Dispatch Solution. I’ll keep it quick.
We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers.
Are you currently booking your own loads or working with a dispatcher?`,
  selfDispatchResponse: `I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork.`,
  closeResponse: `You stay in control of your lanes and loads—we simply work to keep you loaded. Let’s get your setup started. Would you prefer to set up by phone or through our website?`,
  transferNotice: `Fantastic! I am forwarding you directly to Sam Ross right now for your final setup. Please hold while I connect you.`,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dialer' | 'contacts' | 'crm' | 'analytics' | 'feedback'>('dialer');
  const [contacts, setContacts] = useState<TruckingContact[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [scriptConfig, setScriptConfig] = useState<ScriptConfig>(defaultScriptConfig);
  const [isDialerRunning, setIsDialerRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial contacts & call logs from server
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/crm/contacts');
        if (res.ok) {
          const data = await res.json();
          if (data.contacts) setContacts(data.contacts);
          if (data.callLogs) setCallLogs(data.callLogs);
          if (data.scriptConfig) setScriptConfig(data.scriptConfig);
        }
      } catch (err) {
        console.warn('Using client memory state', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Update a single contact
  const handleUpdateContact = (updatedContact: TruckingContact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );
    // Sync to backend asynchronously
    fetch(`/api/crm/contacts/${updatedContact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedContact),
    }).catch((err) => console.warn('Sync contact err', err));
  };

  // Update contacts list (from CSV upload or manual addition)
  const handleUpdateContactsList = (newContacts: TruckingContact[], overwrite?: boolean) => {
    if (overwrite) {
      setContacts(newContacts);
    } else {
      const existingIds = new Set(contacts.map((c) => c.id));
      const filtered = newContacts.filter((c) => !existingIds.has(c.id));
      setContacts((prev) => [...prev, ...filtered]);
    }

    // Sync to backend
    fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newContacts, overwrite }),
    }).catch((err) => console.warn('Sync list err', err));
  };

  // Save new call log
  const handleSaveCallLog = (log: CallLog) => {
    setCallLogs((prev) => [log, ...prev]);

    // Save to backend
    fetch('/api/crm/call-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch((err) => console.warn('Save call log err', err));
  };

  // Handle direct dial action from Contacts or CRM tab
  const handleSelectContactForDial = (contact: TruckingContact) => {
    const idx = contacts.findIndex((c) => c.id === contact.id);
    if (idx !== -1) {
      // Reorder or set as current
      const reordered = [contact, ...contacts.filter((c) => c.id !== contact.id)];
      setContacts(reordered);
    }
    setActiveTab('dialer');
  };

  // Handle direct addition of lead to dial immediately
  const handleAddAndDialContact = (newLead: TruckingContact) => {
    setContacts((prev) => [newLead, ...prev]);
    setActiveTab('dialer');
    fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newContacts: [newLead], overwrite: false }),
    }).catch((err) => console.warn('Sync direct dial lead err', err));
  };

  // Open Direct Dial modal from Header
  const handleOpenDirectDial = () => {
    setActiveTab('dialer');
    // Dispatch small custom event or let dialer handle
    window.dispatchEvent(new CustomEvent('open-direct-dial'));
  };

  // Update contact status directly from CRM pipeline
  const handleUpdateContactStatus = (contactId: string, newStatus: TruckingContact['status']) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      handleUpdateContact({ ...contact, status: newStatus });
    }
  };

  // Counters for Header
  const pendingCount = contacts.filter((c) => c.status === 'Pending').length;
  const completedCount = callLogs.length;
  const qualifiedCount = contacts.filter((c) => c.status === 'Qualified').length;
  const transferredCount = contacts.filter((c) => c.status === 'Transferred').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={pendingCount}
        completedCount={completedCount}
        qualifiedCount={qualifiedCount}
        transferredCount={transferredCount}
        isDialerRunning={isDialerRunning}
        onOpenDirectDial={handleOpenDirectDial}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'dialer' && (
          <DialerConsole
            contacts={contacts}
            onUpdateContact={handleUpdateContact}
            onSaveCallLog={handleSaveCallLog}
            onAddAndDialContact={handleAddAndDialContact}
            scriptConfig={scriptConfig}
            isAutoDialerActive={isDialerRunning}
            setIsAutoDialerActive={setIsDialerRunning}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactManager
            contacts={contacts}
            onUpdateContacts={handleUpdateContactsList}
            onSelectForDial={handleSelectContactForDial}
          />
        )}

        {activeTab === 'crm' && (
          <CrmPipeline
            contacts={contacts}
            callLogs={callLogs}
            onUpdateContactStatus={handleUpdateContactStatus}
            onSelectContactForDial={handleSelectContactForDial}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            callLogs={callLogs}
            contacts={contacts}
          />
        )}

        {activeTab === 'feedback' && (
          <ScriptFeedbackLoop
            scriptConfig={scriptConfig}
            onUpdateScriptConfig={setScriptConfig}
            callLogs={callLogs}
          />
        )}
      </main>

      {/* Footer Branding Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Nexora Dispatch Solution LLC</span>
            <span>•</span>
            <span>Dedicated Dispatch for Owner-Operators & Fleets</span>
            <span>•</span>
            <span className="text-emerald-400">📞 +1 (407) 283-7737</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>TCPA Telemarketing Compliant</span>
            <span>•</span>
            <span>FMCSA Registered Brokerage & Dispatch</span>
            <span>•</span>
            <span>Gemini AI NLP Cold Calling Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
