export type EquipmentCategory =
  | 'Dry Van'
  | 'Reefer'
  | 'Flatbed'
  | 'Hotshot'
  | 'Box truck'
  | 'Sprinter Van/Cargo Van'
  | 'Step Deck'
  | 'Power Only';

export const EQUIPMENT_RATES: Record<string, { rateText: string; percentage: number; basis: string; description: string }> = {
  'Sprinter Van/Cargo Van': {
    rateText: '12% of weekly Gross',
    percentage: 12,
    basis: 'weekly Gross',
    description: 'Expedited freight, high-paying express runs with no forced dispatch.',
  },
  'Box truck': {
    rateText: '10% of weekly Gross',
    percentage: 10,
    basis: 'weekly Gross',
    description: 'Regional & dedicated box truck contracts, liftgate & pallet freight.',
  },
  'Dry Van': {
    rateText: '7%',
    percentage: 7,
    basis: 'per load',
    description: 'General freight, top-tier broker rate negotiations across all 48 states.',
  },
  'Reefer': {
    rateText: '6%',
    percentage: 6,
    basis: 'per load',
    description: 'Temperature-controlled produce, meat & pharma freight at our lowest fee.',
  },
  'Hotshot': {
    rateText: '10%',
    percentage: 10,
    basis: 'per load',
    description: 'High-dollar LTL, partials, machinery & urgent equipment moves.',
  },
  'Flatbed': {
    rateText: '10%',
    percentage: 10,
    basis: 'per load',
    description: 'Building materials, steel, machinery, open deck and tarped freight.',
  },
  'Step Deck': {
    rateText: '10%',
    percentage: 10,
    basis: 'per load',
    description: 'Over-height machinery, heavy haul & industrial equipment loads.',
  },
  'Power Only': {
    rateText: '8%',
    percentage: 8,
    basis: 'per load',
    description: 'Pre-loaded trailers, towaway & drop-and-hook logistics.',
  },
};

export interface TruckingContact {
  id: string;
  name: string;
  mobile: string;
  companyName: string;
  mcNumber: string;
  equipmentType: EquipmentCategory;
  preferredLanes: string;
  truckCount: number;
  status: 'Pending' | 'Ringing' | 'In Call' | 'Qualified' | 'Transferred' | 'Follow-up' | 'Not Interested' | 'DNC';
  lastCallTimestamp?: string;
  callNotes?: string;
  qualificationData?: {
    isSelfDispatching?: boolean;
    equipmentConfirmed?: string;
    quotedRate?: string;
    targetRate?: string;
    preferredLanes?: string;
    willingToSetup?: boolean;
    setupPreference?: 'Phone' | 'Website' | 'Undecided';
    leadScore?: number;
    objectionRaised?: string;
  };
}

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  mobile: string;
  startTime: string;
  durationSeconds: number;
  outcome: 'Transferred to Rep' | 'Qualified - Setup Website' | 'Follow-up Scheduled' | 'Not Interested' | 'DNC' | 'No Answer';
  qualificationScore: number;
  transcript: Array<{ speaker: 'agent' | 'lead'; text: string; time: string }>;
  transferredToRep: boolean;
  repName?: string;
  recordingId: string;
  complianceChecked: boolean;
  summary: string;
  equipmentType: string;
  quotedFeePercentage?: string;
}

export interface ScriptConfig {
  companyName: string;
  agentIdentity: string;
  repPhone: string;
  humanRepName: string;
  websiteUrl: string;
  commissionRate: string;
  primaryPitch: string;
  selfDispatchResponse: string;
  closeResponse: string;
  transferNotice: string;
}

export interface ObjectionInsight {
  objection: string;
  frequency: string;
  recommendation: string;
}
