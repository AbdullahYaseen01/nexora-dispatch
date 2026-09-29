import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory CRM Store with initial sample trucking leads
export interface TruckingContact {
  id: string;
  name: string;
  mobile: string;
  companyName: string;
  mcNumber: string;
  equipmentType: 'Dry Van' | 'Reefer' | 'Flatbed' | 'Hotshot' | 'Box truck' | 'Sprinter Van/Cargo Van' | 'Step Deck' | 'Power Only';
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
  qualificationScore: number; // 0 - 100
  transcript: Array<{ speaker: 'agent' | 'lead'; text: string; time: string }>;
  transferredToRep: boolean;
  repName?: string;
  recordingId: string;
  complianceChecked: boolean;
  summary: string;
  equipmentType: string;
  quotedFeePercentage?: string;
}

let contacts: TruckingContact[] = [
  {
    id: 'c-101',
    name: 'Marcus Vance',
    mobile: '+1 (407) 555-0192',
    companyName: 'Vance Express Hauling LLC',
    mcNumber: 'MC-124982',
    equipmentType: 'Dry Van',
    preferredLanes: 'Southeast to Midwest (FL, GA, TN, OH)',
    truckCount: 2,
    status: 'Pending',
  },
  {
    id: 'c-102',
    name: 'Derrick Henderson',
    mobile: '+1 (832) 555-4391',
    companyName: 'Lone Star Freight Logistics',
    mcNumber: 'MC-892341',
    equipmentType: 'Reefer',
    preferredLanes: 'TX to Midwest / Southeast',
    truckCount: 1,
    status: 'Pending',
  },
  {
    id: 'c-103',
    name: 'Carlos Mendez',
    mobile: '+1 (770) 555-8820',
    companyName: 'Mendez Transport LLC',
    mcNumber: 'MC-564319',
    equipmentType: 'Flatbed',
    preferredLanes: 'GA, NC, SC, AL regional',
    truckCount: 3,
    status: 'Pending',
  },
  {
    id: 'c-104',
    name: 'Jason Kowalski',
    mobile: '+1 (312) 555-7634',
    companyName: 'Iron Wheel Hotshot LLC',
    mcNumber: 'MC-731209',
    equipmentType: 'Hotshot',
    preferredLanes: 'IL, IN, OH, MI, PA',
    truckCount: 1,
    status: 'Pending',
  },
  {
    id: 'c-105',
    name: 'Tyrone Washington',
    mobile: '+1 (901) 555-2248',
    companyName: 'Southern Pride Logistics',
    mcNumber: 'MC-940212',
    equipmentType: 'Box truck',
    preferredLanes: 'TN to NC / SC / FL',
    truckCount: 2,
    status: 'Pending',
  },
  {
    id: 'c-106',
    name: 'Elena Rostova',
    mobile: '+1 (602) 555-3180',
    companyName: 'Express Sprinter Cargo LLC',
    mcNumber: 'MC-415890',
    equipmentType: 'Sprinter Van/Cargo Van',
    preferredLanes: 'AZ, CA, NV, UT expedited lanes',
    truckCount: 3,
    status: 'Pending',
  },
  {
    id: 'c-107',
    name: 'Robert C. Miller',
    mobile: '+1 (412) 555-6617',
    companyName: 'Keystone Logistics Corp',
    mcNumber: 'MC-620415',
    equipmentType: 'Dry Van',
    preferredLanes: 'PA, NJ, NY, MD',
    truckCount: 1,
    status: 'Pending',
  },
  {
    id: 'c-108',
    name: 'Darius Jenkins',
    mobile: '+1 (404) 555-9013',
    companyName: 'Apex Motor Freight',
    mcNumber: 'MC-812390',
    equipmentType: 'Flatbed',
    preferredLanes: 'GA to TX / OK',
    truckCount: 2,
    status: 'Pending',
  },
];

let callLogs: CallLog[] = [
  {
    id: 'log-801',
    contactId: 'c-101-seed',
    contactName: 'Brian O\'Connor',
    mobile: '+1 (904) 555-8831',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    durationSeconds: 142,
    outcome: 'Transferred to Rep',
    qualificationScore: 94,
    transferredToRep: true,
    repName: 'Sam Ross (Senior Dispatch Specialist)',
    recordingId: 'REC-20260927-01',
    complianceChecked: true,
    equipmentType: 'Dry Van',
    summary: 'Lead is an owner-operator with 1 Dry Van running FL to OH. Currently self-dispatching and spending 3+ hrs/day on load boards. Agreed to warm transfer to Sam Ross to finalize setup.',
    transcript: [
      { speaker: 'agent', text: "Hi Brian, this is AI Agent for Sam Ross from Nexora Dispatch Solution. I'll keep it quick. We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers. Are you currently booking your own loads or working with a dispatcher?", time: '00:03' },
      { speaker: 'lead', text: "Yeah I'm booking my own loads right now. It takes forever though.", time: '00:18' },
      { speaker: 'agent', text: "I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork. You stay in control of your lanes and loads—we simply work to keep you loaded. Let’s get your setup started. Would you prefer to set up by phone or through our website?", time: '00:32' },
      { speaker: 'lead', text: "Let's do phone if you got someone available right now.", time: '00:48' },
      { speaker: 'agent', text: "Fantastic! I am transferring you directly to Sam Ross right now. One moment while I connect you.", time: '00:54' },
    ],
  },
];

// Master Script & Configuration with Equipment-Specific Percentage Rates
let agentScriptConfig = {
  companyName: 'Nexora Dispatch Solution LLC',
  agentIdentity: 'Sarah (AI Agent for Sam Ross)',
  repPhone: '+1 (407) 283-7737',
  humanRepName: 'Sam Ross (Senior Dispatch Specialist)',
  websiteUrl: 'https://nexoradispatch.com/setup',
  ratesSchedule: {
    'Sprinter Van/Cargo Van': '12% of weekly Gross',
    'Box truck': '10% of weekly Gross',
    'Dry Van': '7%',
    'Reefer': '6%',
    'Hotshot': '10%',
    'Flatbed': '10%',
    'Step Deck': '10%',
    'Power Only': '8%',
  },
  commissionRate: 'Customized by Equipment: 6% Reefer, 7% Dry Van, 10% Flatbed/Hotshot/Box Truck, 12% Sprinter Van',
  primaryPitch: `Hi [Name], this is Sarah with Nexora Dispatch Solution. I’ll keep it quick.
We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers.
Are you currently booking your own loads or working with a dispatcher?`,
  selfDispatchResponse: `I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork.
What type of equipment are you running right now—is it Dry Van, Reefer, Flatbed, Hotshot, Box Truck, or Sprinter/Cargo Van?`,
  closeResponse: `You stay in control of your lanes and loads—we simply work to keep you loaded. Let’s get your setup started. Would you prefer to set up by phone or through our website?`,
  transferNotice: `Fantastic! I am forwarding you directly to Sam Ross right now for your final setup. Please hold while I connect you.`,
};

// -------------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------------

// GET /api/crm/contacts - Fetch contacts & stats
app.get('/api/crm/contacts', (req, res) => {
  res.json({ contacts, callLogs, scriptConfig: agentScriptConfig });
});

// POST /api/crm/contacts - Update contact list (from CSV upload or manual add)
app.post('/api/crm/contacts', (req, res) => {
  const { newContacts, overwrite } = req.body;
  if (!Array.isArray(newContacts)) {
    return res.status(400).json({ error: 'Expected newContacts array' });
  }

  if (overwrite) {
    contacts = newContacts;
  } else {
    // Merge or prepend
    const existingIds = new Set(contacts.map((c) => c.id));
    for (const c of newContacts) {
      if (!c.id) c.id = 'c-' + Math.random().toString(36).substring(2, 9);
      if (!existingIds.has(c.id)) {
        contacts.push(c);
      }
    }
  }
  res.json({ success: true, count: contacts.length, contacts });
});

// PATCH /api/crm/contacts/:id - Update single contact
app.patch('/api/crm/contacts/:id', (req, res) => {
  const { id } = req.params;
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  contacts[index] = { ...contacts[index], ...req.body };
  res.json({ success: true, contact: contacts[index] });
});

// POST /api/crm/call-logs - Save completed call log
app.post('/api/crm/call-logs', (req, res) => {
  const log: CallLog = req.body;
  if (!log.id) {
    log.id = 'log-' + Math.random().toString(36).substring(2, 9);
  }
  callLogs.unshift(log);

  // Sync to contact status
  if (log.contactId) {
    const contact = contacts.find((c) => c.id === log.contactId);
    if (contact) {
      contact.lastCallTimestamp = log.startTime;
      if (log.transferredToRep) {
        contact.status = 'Transferred';
      } else if (log.outcome === 'Qualified - Setup Website') {
        contact.status = 'Qualified';
      } else if (log.outcome === 'Not Interested') {
        contact.status = 'Not Interested';
      } else if (log.outcome === 'DNC') {
        contact.status = 'DNC';
      } else if (log.outcome === 'Follow-up Scheduled') {
        contact.status = 'Follow-up';
      }
      contact.callNotes = log.summary;
    }
  }

  res.json({ success: true, log });
});

// POST /api/crm/sync-webhook - Simulate pushing to CRM (HubSpot, Salesforce, TruckStop)
app.post('/api/crm/sync-webhook', (req, res) => {
  const { destination, payload } = req.body;
  const syncId = 'crm_sync_' + Date.now();
  res.json({
    success: true,
    syncId,
    destination: destination || 'HubSpot Logistics CRM',
    status: 'SYNCED_SUCCESSFULLY',
    syncedAt: new Date().toISOString(),
    recordCount: Array.isArray(payload) ? payload.length : 1,
  });
});

// POST /api/gemini/call-turn - Conversational AI Engine for Cold Calling Lead Qualification
app.post('/api/gemini/call-turn', async (req, res) => {
  try {
    const { contact, history, leadSpeech, callDurationSeconds } = req.body;

    // Helper: Determine exact equipment rate
    const getEquipmentRate = (equip: string): string => {
      const e = equip.toLowerCase();
      if (e.includes('sprinter') || e.includes('cargo van') || e.includes('van')) return '12% of weekly Gross';
      if (e.includes('box')) return '10% of weekly Gross';
      if (e.includes('reefer') || e.includes('refrigerated') || e.includes('temperature')) return '6%';
      if (e.includes('flatbed') || e.includes('flat')) return '10%';
      if (e.includes('hotshot') || e.includes('hot shot')) return '10%';
      if (e.includes('dry') || e.includes('dry van')) return '7%';
      return '7%';
    };

    if (!ai) {
      // Deterministic response engine if API key isn't provided
      const turnCount = history.length;
      let replyText = '';
      let shouldTransfer = false;
      let outcome = 'In Progress';
      let qualificationScore = 70;
      let detectedEquipment = contact?.equipmentType || '';
      let quotedFee = getEquipmentRate(detectedEquipment);

      const speechLower = (leadSpeech || '').toLowerCase();

      // Check equipment keywords in caller speech
      if (speechLower.includes('sprinter') || speechLower.includes('cargo van')) {
        detectedEquipment = 'Sprinter Van/Cargo Van';
        quotedFee = '12% of weekly Gross';
      } else if (speechLower.includes('box truck') || speechLower.includes('box')) {
        detectedEquipment = 'Box truck';
        quotedFee = '10% of weekly Gross';
      } else if (speechLower.includes('reefer') || speechLower.includes('refrigerated')) {
        detectedEquipment = 'Reefer';
        quotedFee = '6%';
      } else if (speechLower.includes('hotshot') || speechLower.includes('hot shot')) {
        detectedEquipment = 'Hotshot';
        quotedFee = '10%';
      } else if (speechLower.includes('flatbed') || speechLower.includes('flat')) {
        detectedEquipment = 'Flatbed';
        quotedFee = '10%';
      } else if (speechLower.includes('dry van') || speechLower.includes('van')) {
        detectedEquipment = 'Dry Van';
        quotedFee = '7%';
      }

      if (speechLower.includes('not interested') || speechLower.includes('stop calling') || speechLower.includes('dnc')) {
        replyText = "Understood. I will immediately remove your number from our contact list. Have a safe drive and thank you for your time.";
        outcome = speechLower.includes('stop calling') || speechLower.includes('dnc') ? 'DNC' : 'Not Interested';
        qualificationScore = 15;
      } else if (speechLower.includes('phone') || speechLower.includes('talk to someone') || speechLower.includes('transfer') || speechLower.includes('sign me up') || speechLower.includes('sounds good')) {
        replyText = "Fantastic! I'm forwarding you directly to Sam Ross, our senior dispatch specialist, right now. Please hold for just a few seconds while I bridge the line.";
        shouldTransfer = true;
        outcome = 'Transferred to Rep';
        qualificationScore = 95;
      } else if (speechLower.includes('website') || speechLower.includes('send link') || speechLower.includes('online')) {
        replyText = `Great! You can visit our portal at ${agentScriptConfig.websiteUrl} or text our dispatch desk at ${agentScriptConfig.repPhone}. We'll follow up shortly!`;
        outcome = 'Qualified - Setup Website';
        qualificationScore = 85;
      } else if (speechLower.includes('sprinter') || speechLower.includes('box') || speechLower.includes('reefer') || speechLower.includes('flatbed') || speechLower.includes('hotshot') || speechLower.includes('dry')) {
        // Equipment was just stated! Quote the exact rate according to equipment type:
        replyText = `Got it! For ${detectedEquipment}, our dispatch rate is ${quotedFee} with zero forced dispatch. You stay in control of your lanes and loads—we simply work to keep you loaded. Would you prefer to set up by phone or through our website?`;
        qualificationScore = 85;
      } else if (turnCount <= 1 || speechLower.includes('booking') || speechLower.includes('self') || speechLower.includes('own')) {
        // Self-dispatching confirmed, now ask about equipment type:
        replyText = "I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork. What type of equipment are you running right now—Dry Van, Reefer, Flatbed, Hotshot, Box Truck, or Sprinter/Cargo Van?";
        qualificationScore = 80;
      } else {
        replyText = `For ${detectedEquipment}, our dispatch fee is ${quotedFee} with zero forced dispatch and dedicated broker negotiations. Would you prefer to set up by phone with Sam Ross or through our website?`;
        qualificationScore = 75;
      }

      return res.json({
        replyText,
        shouldTransfer,
        leadScore: qualificationScore,
        outcome,
        detectedEquipment,
        quotedFee,
        extractedData: {
          isSelfDispatching: speechLower.includes('own') || speechLower.includes('self'),
          setupPreference: speechLower.includes('phone') ? 'Phone' : speechLower.includes('website') ? 'Website' : 'Undecided',
          equipment: detectedEquipment,
          quotedFee,
        },
        complianceNote: 'Greeting TCPA disclosure and business identification fulfilled.',
      });
    }

    // Call Gemini 3.8 Flash for intelligent qualification and equipment percentage quotation
    const systemPrompt = `You are Sarah, an AI cold-calling voice agent with a nice, warm American lady voice calling for "Nexora Dispatch Solution LLC" on behalf of Sam Ross.
Official contact phone: +1 (407) 283-7737.

TARGET CONTACT:
- Name: ${contact?.name || 'Driver'}
- Mobile: ${contact?.mobile || 'Unknown'}
- Company: ${contact?.companyName || 'Motor Carrier'}
- MC Number: ${contact?.mcNumber || 'MC-Pending'}
- Current Equipment on file: ${contact?.equipmentType || 'Unknown'}
- Preferred Lanes: ${contact?.preferredLanes || 'Regional / OTR'}

STRICT MANDATORY EQUIPMENT TYPE & PERCENTAGE RATE SCHEDULE:
When the driver mentions or confirms their equipment type (or if you are quoting rates), YOU MUST TELL THEM THE EXACT PERCENTAGE ACCORDING TO EQUIPMENT TYPE:
- Sprinter Van / Cargo Van: 12% of weekly Gross
- Box truck: 10% of weekly Gross
- Dry Van: 7%
- Reefer: 6%
- Hotshot: 10%
- Flatbed: 10%
- Step Deck: 10%
- Power Only: 8%

CONVERSATION & QUALIFICATION RULES:
1. Warm Opening:
   - "Hi ${contact?.name || 'Driver'}, this is Sarah with Nexora Dispatch Solution. I’ll keep it quick. We help owner-operators find quality loads, negotiate better rates, and keep their trucks moving without wasting hours searching and calling brokers. Are you currently booking your own loads or working with a dispatcher?"
2. If Driver is booking own loads / self-dispatching:
   - Empathize, then IMMEDIATELY ASK ABOUT EQUIPMENT TYPE:
   - "I understand. Our job is to take that workload off you so you can focus on driving while we handle the load search, broker calls, negotiation, and paperwork. What type of equipment are you running right now—Dry Van, Reefer, Flatbed, Hotshot, Box Truck, or Sprinter/Cargo Van?"
3. When Equipment Type is Answered:
   - Acknowledge and state the exact percentage fee matching their equipment:
     - If Sprinter Van/Cargo Van: "For Sprinter Van and Cargo Van, our rate is 12% of weekly Gross with zero forced dispatch and dedicated express freight."
     - If Box truck: "For Box Truck, our fee is 10% of weekly Gross with no forced dispatch and dedicated regional freight."
     - If Dry Van: "For Dry Van, our fee is just 7% flat per load with dedicated broker negotiations."
     - If Reefer: "For Reefer, our fee is only 6%—our lowest percentage rate because of higher gross market earnings."
     - If Hotshot: "For Hotshot, our rate is 10% per load, keeping you loaded on top-paying machinery and partials."
     - If Flatbed: "For Flatbed, our fee is 10% per load, and we specialize in top-dollar building materials and open-deck freight."
   - Follow immediately with the Close:
     - "You stay in control of your lanes and loads—we simply work to keep you loaded. Let’s get your setup started. Would you prefer to set up by phone or through our website?"
4. Transfer Condition:
   - IF the driver agrees, expresses interest, asks for phone setup, asks to speak to Sam Ross, or wants immediate setup: Set shouldTransfer to true, and say: "Fantastic! I am forwarding you directly to Sam Ross right now for your final setup. Please hold while I connect you."
5. Objection & Regulatory Compliance:
   - DNC / Not interested: Immediately honor: "I completely understand. I will place your number on our Do Not Call list right now. Have a safe drive."
   - Voice style: Warm, friendly, polite, empathetic American lady voice. Keep spoken turns concise (under 35 words).

Return JSON strictly adhering to schema.`;

    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: `Conversation transcript so far:
${JSON.stringify(history, null, 2)}

Latest statement by driver (${contact?.name}):
"${leadSpeech}"

Analyze the driver's response. Did they state their equipment type? Tell them the exact percentage fee according to their equipment type. Determine if we should forward call to Sam Ross, score the lead (0-100), extract equipment and fee details, and check TCPA compliance.`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: {
              type: Type.STRING,
              description: 'The natural spoken response for the AI agent (Sarah) to say out loud.',
            },
            shouldTransfer: {
              type: Type.BOOLEAN,
              description: 'True if customer agreed or wants setup by phone or requested human specialist.',
            },
            leadScore: {
              type: Type.NUMBER,
              description: 'Lead qualification score from 0 (DNC/hostile) to 100 (ready to close).',
            },
            outcome: {
              type: Type.STRING,
              description: 'Current disposition: Transferred to Rep, Qualified - Setup Website, Follow-up Scheduled, Not Interested, DNC, or In Progress.',
            },
            detectedEquipment: {
              type: Type.STRING,
              description: 'Identified equipment: Sprinter Van/Cargo Van, Box truck, Dry Van, Reefer, Hotshot, Flatbed, Step Deck, or Unknown.',
            },
            quotedFee: {
              type: Type.STRING,
              description: 'The exact percentage quoted: 12% of weekly Gross, 10% of weekly Gross, 7%, 6%, or 10%.',
            },
            isSelfDispatching: {
              type: Type.BOOLEAN,
              description: 'Whether driver indicated they book own loads.',
            },
            setupPreference: {
              type: Type.STRING,
              description: 'Phone, Website, or Undecided.',
            },
            objectionDetected: {
              type: Type.STRING,
              description: 'Summary of objection if any, else empty.',
            },
            complianceChecked: {
              type: Type.BOOLEAN,
              description: 'Whether conversation adhered to TCPA and company standards.',
            },
            callSummary: {
              type: Type.STRING,
              description: 'Brief 1-sentence note for CRM record.',
            },
          },
          required: ['replyText', 'shouldTransfer', 'leadScore', 'outcome', 'complianceChecked'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Call turn error:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// POST /api/gemini/tts - Generate Spoken Audio for Agent using gemini-3.8-flash-lite-tts
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    if (!ai) {
      return res.json({ audioBase64: null, note: 'Gemini API key not configured, frontend will use Web Speech API fallback' });
    }

    // Call gemini-3.8-flash-lite-tts with nice American lady voice
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Warm, polite, friendly, and articulate American lady dispatch specialist with natural Midwestern/Standard American pronunciation, speaking empathetically and professionally with truck drivers',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' }, // Nice Lady Voice: Kore, Aoede
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audioBase64: base64Audio || null, sampleRate: 24000 });
  } catch (err: any) {
    console.error('TTS error:', err);
    // Graceful fallback to client Web Speech API
    res.json({ audioBase64: null, error: err.message, fallbackToWebSpeech: true });
  }
});

// POST /api/gemini/simulate-driver - Simulate realistic truck driver replies for testing
app.post('/api/gemini/simulate-driver', async (req, res) => {
  try {
    const { persona, agentStatement, conversationHistory, contact } = req.body;

    if (!ai) {
      const presets: Record<string, string> = {
        interested: "Yeah, I'm booking my own loads right now. It takes forever. Let's do it by phone if you got someone ready.",
        skeptical: "What's your commission fee? Most dispatchers charge too much and give me cheap freight.",
        busy: "Hey man, I'm backing into a dock right now. What's your website? I can check it out tonight.",
        not_interested: "No thanks, I got my own brokers and I'm doing fine. Please take me off the list.",
      };
      return res.json({ text: presets[persona] || presets.interested });
    }

    const prompt = `You are a real commercial truck owner-operator driving on the road receiving a cold call from Nexora Dispatch Solution.
Contact info:
- Name: ${contact?.name || 'Driver'}
- Equipment: ${contact?.equipmentType || 'Dry Van'}
- Current Lane: ${contact?.preferredLanes || 'Midwest'}

Driver Persona: ${persona} (e.g. "eager owner-operator tired of calling brokers", "skeptical driver worried about 10% fee", "driver busy on highway wanting quick phone setup", "driver who wants website").
Agent just said: "${agentStatement}"

Conversation history so far:
${JSON.stringify(conversationHistory || [], null, 2)}

Respond naturally as the trucker would speak on a hands-free headset. Keep it short (1-2 sentences), authentic trucker tone (e.g., mentioning loads, deadhead, brokers, or lanes). Do not sound like an AI.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ text: response.text?.trim() || "Yeah, I'm listening. Tell me more." });
  } catch (err: any) {
    res.json({ text: "Yeah I'm booking my own loads right now. Let's talk by phone." });
  }
});

// POST /api/gemini/refine-feedback - Robust feedback loop to optimize scripts and handle rejections
app.post('/api/gemini/refine-feedback', async (req, res) => {
  try {
    const { logs, currentScript } = req.body;

    if (!ai) {
      return res.json({
        topObjections: [
          { objection: 'Driver is already self-dispatching', frequency: '45%', recommendation: 'Emphasize hours saved calling brokers and detention pay recovery.' },
          { objection: 'Commission fee hesitation (7%)', frequency: '30%', recommendation: 'Highlight net profit gain: 7% fee vs avg 18% higher rate negotiated by Sam Ross.' },
          { objection: 'Requests setup via website instead of live phone', frequency: '25%', recommendation: 'Offer automated SMS with 1-click carrier packet setup.' },
        ],
        complianceScore: 98,
        complianceNotes: 'TCPA identity disclosures and DNC requests are being honored promptly.',
        improvedPitchVariant: `Hi [Name], this is AI Agent for Sam Ross with Nexora Dispatch. Quick question—are you spending more than 2 hours a day on load boards, or do you have a dispatcher getting you above $2.60/mile right now?`,
      });
    }

    const prompt = `You are a freight dispatch optimization specialist and regulatory compliance auditor for Nexora Dispatch Solution LLC.
Analyze the following recent call logs and current script configuration:
Current Script:
${JSON.stringify(currentScript, null, 2)}

Call Logs Summary:
${JSON.stringify(logs?.slice(0, 10) || [], null, 2)}

Provide an actionable feedback analysis:
1. Identify the top 3 driver objections and actionable counter-scripts.
2. TCPA and regulatory compliance audit score (0-100) and tips (e.g., calling windows, opt-out clarity).
3. A refined A/B test variant of the opening hook that maximizes qualification rates.

Return response in JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topObjections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  objection: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['objection', 'frequency', 'recommendation'],
              },
            },
            complianceScore: { type: Type.NUMBER },
            complianceNotes: { type: Type.STRING },
            improvedPitchVariant: { type: Type.STRING },
          },
          required: ['topObjections', 'complianceScore', 'complianceNotes', 'improvedPitchVariant'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// SERVER INITIALIZATION (DEV & PROD)
// -------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexora Dispatch AI Cold Calling Platform running on port ${PORT}`);
  });
}

export { app };

if (!process.env.VERCEL) {
  startServer();
}
