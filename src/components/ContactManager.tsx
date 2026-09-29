import React, { useState, useRef } from 'react';
import { TruckingContact } from '../types/trucking';
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  PhoneCall,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';

interface ContactManagerProps {
  contacts: TruckingContact[];
  onUpdateContacts: (contacts: TruckingContact[], overwrite?: boolean) => void;
  onSelectForDial: (contact: TruckingContact) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({
  contacts,
  onUpdateContacts,
  onSelectForDial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Contact Form State
  const [newContact, setNewContact] = useState<Partial<TruckingContact>>({
    name: '',
    mobile: '',
    companyName: '',
    mcNumber: 'MC-',
    equipmentType: 'Dry Van',
    preferredLanes: 'Midwest to Southeast',
    truckCount: 1,
    status: 'Pending',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mcNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEquip = equipmentFilter === 'All' || c.equipmentType === equipmentFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesEquip && matchesStatus;
  });

  // Handle CSV File Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseCsvString(text);
    };
    reader.readAsText(file);
  };

  // Parse CSV text into preview rows
  const parseCsvString = (text: string) => {
    try {
      setUploadError(null);
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setUploadError('CSV must contain a header row and at least one contact row.');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map((h) => h.replace(/['"]+/g, '').trim().toLowerCase());

      const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('contact'));
      const mobileIdx = headers.findIndex((h) => h.includes('mobile') || h.includes('phone') || h.includes('number') || h.includes('cell'));
      const companyIdx = headers.findIndex((h) => h.includes('company') || h.includes('carrier') || h.includes('business'));
      const mcIdx = headers.findIndex((h) => h.includes('mc') || h.includes('dot'));
      const equipIdx = headers.findIndex((h) => h.includes('equipment') || h.includes('trailer') || h.includes('type'));
      const lanesIdx = headers.findIndex((h) => h.includes('lane') || h.includes('preferred') || h.includes('route'));

      if (nameIdx === -1 || mobileIdx === -1) {
        setUploadError('CSV must include "Name" and "Mobile" / "Phone" columns.');
        return;
      }

      const parsed: TruckingContact[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Split handling quotes
        const row = lines[i].split(',').map((val) => val.replace(/['"]+/g, '').trim());
        if (row.length <= 1) continue;

        const name = row[nameIdx] || 'Owner Operator';
        const mobile = row[mobileIdx] || '+1 (407) 555-0100';
        const companyName = companyIdx !== -1 && row[companyIdx] ? row[companyIdx] : `${name} Logistics LLC`;
        const mcNumber = mcIdx !== -1 && row[mcIdx] ? row[mcIdx] : `MC-${Math.floor(100000 + Math.random() * 900000)}`;
        const equipmentType = equipIdx !== -1 && row[equipIdx] ? (row[equipIdx] as any) : 'Dry Van';
        const preferredLanes = lanesIdx !== -1 && row[lanesIdx] ? row[lanesIdx] : 'Regional / OTR';

        parsed.push({
          id: 'c-csv-' + Date.now() + '-' + i,
          name,
          mobile,
          companyName,
          mcNumber,
          equipmentType,
          preferredLanes,
          truckCount: 1,
          status: 'Pending',
        });
      }

      setCsvPreview(parsed);
    } catch (err: any) {
      setUploadError('Failed to parse CSV: ' + err.message);
    }
  };

  // Confirm Import
  const handleConfirmImport = (overwrite: boolean) => {
    if (csvPreview.length === 0) return;
    onUpdateContacts(csvPreview, overwrite);
    setIsUploadModalOpen(false);
    setCsvPreview([]);
    setCsvRawText('');
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample = `Contact Name,Mobile Number,Company Name,MC Number,Equipment Type,Preferred Lanes\nMarcus Vance,+1 (407) 555-0192,Vance Express Hauling LLC,MC-124982,Dry Van,Southeast to Midwest\nDerrick Henderson,+1 (832) 555-4391,Lone Star Freight Logistics,MC-892341,Reefer,TX to Midwest\nCarlos Mendez,+1 (770) 555-8820,Mendez Transport LLC,MC-564319,Flatbed,GA NC SC Regional\nJason Kowalski,+1 (312) 555-7634,Iron Wheel Haulers,MC-731209,Step Deck,IL IN OH PA\nTyrone Washington,+1 (901) 555-2248,Southern Pride Heavy Haul,MC-940212,Dry Van,TN to FL and Carolinas`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nexora_trucking_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Current Contacts to CSV
  const handleExportContacts = () => {
    const header = 'Name,Mobile,Company,MC Number,Equipment,Preferred Lanes,Status,Lead Score,Last Call\n';
    const rows = contacts
      .map(
        (c) =>
          `"${c.name}","${c.mobile}","${c.companyName}","${c.mcNumber}","${c.equipmentType}","${c.preferredLanes}","${c.status}","${c.qualificationData?.leadScore || 0}","${c.lastCallTimestamp || 'Never'}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexora_crm_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Single Contact
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.mobile) return;

    const contactToAdd: TruckingContact = {
      id: 'c-manual-' + Date.now(),
      name: newContact.name,
      mobile: newContact.mobile,
      companyName: newContact.companyName || `${newContact.name} Transport`,
      mcNumber: newContact.mcNumber || 'MC-' + Math.floor(100000 + Math.random() * 900000),
      equipmentType: (newContact.equipmentType as any) || 'Dry Van',
      preferredLanes: newContact.preferredLanes || 'All 48 States',
      truckCount: newContact.truckCount || 1,
      status: 'Pending',
    };

    onUpdateContacts([contactToAdd, ...contacts], true);
    setIsAddModalOpen(false);
    setNewContact({
      name: '',
      mobile: '',
      companyName: '',
      mcNumber: 'MC-',
      equipmentType: 'Dry Van',
      preferredLanes: 'Midwest to Southeast',
      truckCount: 1,
      status: 'Pending',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Structured CSV Contact Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Owner-operator contact database for sequential dialing and NLP lead qualification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadSampleCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportContacts}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by driver name, mobile, company, or MC#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Equipment Filter */}
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Equipment</option>
            <option value="Sprinter Van/Cargo Van">Sprinter Van / Cargo Van (12%)</option>
            <option value="Box truck">Box Truck (10%)</option>
            <option value="Dry Van">Dry Van (7%)</option>
            <option value="Reefer">Reefer (6%)</option>
            <option value="Hotshot">Hotshot (10%)</option>
            <option value="Flatbed">Flatbed (10%)</option>
            <option value="Step Deck">Step Deck (10%)</option>
            <option value="Power Only">Power Only (8%)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Transferred">Transferred to Sam Ross</option>
            <option value="Qualified">Qualified</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Not Interested">Not Interested</option>
            <option value="DNC">DNC (Do Not Call)</option>
          </select>

          <span className="text-slate-400 pl-2">
            Showing <strong className="text-white">{filteredContacts.length}</strong> leads
          </span>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Direct Mobile</th>
                <th className="py-3 px-4">MC Number</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Preferred Lanes</th>
                <th className="py-3 px-4">Status / AI Score</th>
                <th className="py-3 px-4 text-right">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No contacts found matching criteria. Upload a CSV or click "Add Lead".
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.companyName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                      {c.mobile}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.mcNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        c.equipmentType === 'Reefer' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                        c.equipmentType === 'Flatbed' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                        c.equipmentType === 'Step Deck' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                        'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}>
                        {c.equipmentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {c.preferredLanes}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'Transferred' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          c.status === 'Qualified' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          c.status === 'Follow-up' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          c.status === 'DNC' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          c.status === 'Not Interested' ? 'bg-slate-700 text-slate-300 border-slate-600' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {c.status}
                        </span>
                        {c.qualificationData?.leadScore && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({c.qualificationData.leadScore}/100)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectForDial(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Dial</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Import CSV Contact File</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                Upload a CSV sheet with owner-operator details. The system automatically maps columns for <strong>Contact Name</strong>, <strong>Mobile</strong>, <strong>Company Name</strong>, <strong>MC Number</strong>, and <strong>Equipment Type</strong>.
              </p>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/60"
              >
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
                <p className="font-semibold text-white">Click or drag & drop .csv file here</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports UTF-8 CSV with standard comma delimiter</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadError && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-300">
                    <span>Parsed {csvPreview.length} contacts successfully:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Load
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-lg p-2 border border-slate-800 space-y-1">
                    {csvPreview.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-900 text-slate-300">
                        <span className="font-medium text-white">{row.name} ({row.companyName})</span>
                        <span className="font-mono text-emerald-400">{row.mobile}</span>
                        <span className="text-slate-400">{row.equipmentType}</span>
                      </div>
                    ))}
                    {csvPreview.length > 5 && (
                      <div className="text-center text-slate-500 pt-1">
                        ...and {csvPreview.length - 5} more records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  disabled={csvPreview.length === 0}
                  onClick={() => handleConfirmImport(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-40"
                >
                  Append to Existing Queue ({csvPreview.length})
                </button>
                <button
                  disabled={csvPreview.length === 0}
                  onClick={() => handleConfirmImport(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-40"
                >
                  Replace Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Add Trucking Lead Manually</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Contact Name *</label>
                  <input
                    required
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="e.g. Travis Scott"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Direct Mobile *</label>
                  <input
                    required
                    type="text"
                    value={newContact.mobile}
                    onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                    placeholder="e.g. +1 (407) 555-0199"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={newContact.companyName}
                    onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                    placeholder="e.g. Scott Freight LLC"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">MC Number</label>
                  <input
                    type="text"
                    value={newContact.mcNumber}
                    onChange={(e) => setNewContact({ ...newContact, mcNumber: e.target.value })}
                    placeholder="MC-123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Equipment Type</label>
                  <select
                    value={newContact.equipmentType}
                    onChange={(e) => setNewContact({ ...newContact, equipmentType: e.target.value as any })}
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
                  <label className="text-slate-300 font-medium">Preferred Lanes</label>
                  <input
                    type="text"
                    value={newContact.preferredLanes}
                    onChange={(e) => setNewContact({ ...newContact, preferredLanes: e.target.value })}
                    placeholder="e.g. FL to TX / Midwest"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add to Calling Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
