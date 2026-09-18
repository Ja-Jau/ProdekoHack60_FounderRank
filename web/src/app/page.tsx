"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Clock,
  SlidersHorizontal,
  RotateCw,
  Sparkles,
  Filter,
  Calendar,
  Linkedin,
  MessageSquare
} from "lucide-react";

// --- TYPES & DEFAULTS ---
interface QuestionnaireSettings {
  stages: string[];
  minTraction: string;
  coreSectors: string; // Changed to string for text input
  excludedSectors: string; // Changed to string for text input
  geographies: string[];
  founderArchetypes: string[];
  benchmarkCompanies: string;
}

const defaultCriteria: QuestionnaireSettings = {
  stages: ["Pre-Seed", "Seed"],
  minTraction: "MVP / Alpha Live",
  coreSectors: "",
  excludedSectors: "",
  geographies: ["Nordics & Baltics", "Western Europe / UK"],
  founderArchetypes: ["technical_depth", "scaleup_alumni"],
  benchmarkCompanies: ""
};

const mockLeads = [
  {
    id: "req_slush_4412",
    contact: { full_name: "Marta Lindqvist", location: "Stockholm, Sweden" },
    startup: { name: "FlowLog", stage: "Seed", market_vertical: "Developer Tools", raised: "$650k" },
    match_score: 88,
    status: "pending",
    proposed_time: "Nov 30, 14:00 - 14:20",
    linkedin_url: "https://linkedin.com/in/martalindqvist",
    slush_url: "https://platform.slush.org/meetings/req_slush_4412",
    positive_drivers: [
      "Technical founder pedigree: Ex-Staff Engineer at Spotify.",
      "Matches target vertical: Developer Tools.",
      "Matches target geography: Nordics."
    ],
    red_flags: ["High competition in edge observability space."],
    pitch: "Hi! We saw your focus on developer platforms. We're an ex-Spotify engineering team scaling FlowLog past $25k MRR. Would love to grab 15 mins at Slush to share our seed deck."
  },
  {
    id: "req_slush_4413",
    contact: { full_name: "Johannes Virtanen", location: "Helsinki, Finland" },
    startup: { name: "RetailNode", stage: "Series A", market_vertical: "D2C / E-commerce", raised: "$2.1M" },
    match_score: 34,
    status: "pending",
    proposed_time: "Nov 30, 15:30 - 15:50",
    linkedin_url: "https://linkedin.com/in/johannesvirtanen",
    slush_url: "https://platform.slush.org/meetings/req_slush_4413",
    positive_drivers: ["Strong domestic traction."],
    red_flags: [
      "Excluded sector match: D2C / E-commerce is on your pass list.",
      "Outside primary investment stage focus."
    ],
    pitch: "Looking to connect with investors for our Series A expansion into the UK market."
  },
  {
    id: "req_slush_4414",
    contact: { full_name: "Elena Rostova", location: "Berlin, Germany" },
    startup: { name: "AeroAI", stage: "Pre-Seed", market_vertical: "AI / ML Infrastructure", raised: "Uncapped Note" },
    match_score: 95,
    status: "pending",
    proposed_time: "Dec 1, 10:00 - 10:20",
    linkedin_url: "https://linkedin.com/in/elenarostova",
    slush_url: "https://platform.slush.org/meetings/req_slush_4414",
    positive_drivers: [
      "Perfect Thesis Match: AI Infrastructure.",
      "Exceptional technical background (PhD Data Science, TUM).",
      "Building within target geography."
    ],
    red_flags: [],
    pitch: "Building the next generation of localized LLM deployment frameworks. Currently running closed beta with 3 enterprise design partners."
  }
];

export default function SlushTriageDashboard() {
  const [leads, setLeads] = useState(mockLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(mockLeads[0].id);

  // Questionnaire & Settings State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isReranking, setIsReranking] = useState(false);
  const [settings, setSettings] = useState<QuestionnaireSettings>(defaultCriteria);
  const [tempSettings, setTempSettings] = useState<QuestionnaireSettings>(defaultCriteria);

  useEffect(() => {
    const saved = localStorage.getItem("vc_slush_criteria");
    if (!saved) {
      setIsFirstTime(true);
      setIsModalOpen(true);
    } else {
      try {
        const parsed = JSON.parse(saved);

        // Handle migration from previous array-based sectors to string
        if (Array.isArray(parsed.coreSectors)) parsed.coreSectors = parsed.coreSectors.join(", ");
        if (Array.isArray(parsed.excludedSectors)) parsed.excludedSectors = parsed.excludedSectors.join(", ");

        // CRITICAL BUG FIX: Merge parsed data with defaultCriteria to ensure new keys exist
        const mergedSettings = { ...defaultCriteria, ...parsed };

        // Extra safeguard: Ensure array properties are actually arrays
        Object.keys(defaultCriteria).forEach((key) => {
          const k = key as keyof QuestionnaireSettings;
          if (Array.isArray(defaultCriteria[k]) && !Array.isArray(mergedSettings[k])) {
            mergedSettings[k] = defaultCriteria[k] as any;
          }
        });

        setSettings(mergedSettings);
        setTempSettings(mergedSettings);
      } catch (e) {
        console.error("Failed to parse settings", e);
        setSettings(defaultCriteria);
        setTempSettings(defaultCriteria);
      }
    }
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleAction = (id: string, action: "accepted" | "declined") => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: action } : lead));
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem("vc_slush_criteria", JSON.stringify(tempSettings));
    setIsModalOpen(false);

    if (!isFirstTime) {
      setIsReranking(true);
      setTimeout(() => {
        setIsReranking(false);
      }, 3000);
    } else {
      setIsFirstTime(false);
    }
  };

  const toggleArrayItem = (key: keyof QuestionnaireSettings, value: string) => {
    const current = tempSettings[key] as string[];
    if (!Array.isArray(current)) return;

    const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
    setTempSettings({ ...tempSettings, [key]: updated });
  };

  return (
      <div className="flex h-screen bg-black font-sans text-zinc-100 selection:bg-green-500 selection:text-black overflow-hidden">

        {/* LEFT PANEL: INBOX / LIST */}
        <div className="w-full md:w-1/3 lg:w-[420px] border-r border-zinc-800 bg-zinc-950 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 sticky top-0 z-10 shrink-0">
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white">Slush<span className="text-green-500 animate-pulse">_</span>Triage</h1>
              <p className="text-[10px] text-green-500 uppercase tracking-widest mt-1 font-bold">Live Deal Flow</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                  onClick={() => {
                    setTempSettings(settings);
                    setIsModalOpen(true);
                  }}
                  className="p-2 border border-zinc-800 rounded-sm hover:bg-zinc-800 hover:border-green-500 text-zinc-400 hover:text-green-400 transition-colors"
                  title="Edit Scoring Thesis"
              >
                <SlidersHorizontal size={18} />
              </button>
              <span className="bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] font-bold px-2.5 py-1.5 rounded-sm uppercase tracking-widest whitespace-nowrap">
              {leads.filter(l => l.status === 'pending').length} Pending
            </span>
            </div>
          </div>

          {/* Re-ranking Notification Banner */}
          {isReranking && (
              <div className="bg-green-950/30 border-b border-green-900/50 p-3 flex items-center text-[10px] text-green-400 uppercase tracking-widest font-bold shrink-0">
                <RotateCw size={14} className="animate-spin mr-3 flex-shrink-0" />
                <span>Recalculating Match Scores...</span>
              </div>
          )}

          {/* Leads Scroll Area */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {leads.map((lead) => (
                <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-5 border-b border-zinc-900 cursor-pointer transition-all duration-200 group ${
                        selectedLeadId === lead.id
                            ? "bg-zinc-900 border-l-4 border-l-green-500"
                            : "hover:bg-zinc-900/50 border-l-4 border-l-transparent"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-black text-lg tracking-tight uppercase ${selectedLeadId === lead.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{lead.startup.name}</h3>
                    <span className={`text-sm font-black tracking-tighter flex items-center ${
                        lead.match_score >= 70 ? "text-green-400" : lead.match_score >= 50 ? "text-yellow-400" : "text-red-500"
                    }`}>
                  {lead.match_score} <span className="text-zinc-600 text-[10px] ml-0.5">/100</span>
                </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium tracking-wide flex items-center mb-1">
                    {lead.contact.full_name} <span className="text-zinc-700 mx-2">•</span> {lead.startup.stage}
                  </p>

                  {lead.status !== 'pending' && (
                      <div className="mt-3 flex">
                  <span className={`text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-widest ${
                      lead.status === 'accepted' ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    {lead.status === 'accepted' ? 'Meeting Accepted' : 'Passed'}
                  </span>
                      </div>
                  )}
                </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: DETAILS & TRIAGE */}
        <div className="flex-1 bg-black overflow-y-auto relative custom-scrollbar">
          {/* Futuristic background grid accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] opacity-30 pointer-events-none"></div>

          {selectedLead ? (
              <div className="max-w-5xl mx-auto p-8 md:p-12 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-12 gap-8">
                  <div className="flex-1">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase leading-none">{selectedLead.startup.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-bold uppercase tracking-widest mb-5">
                      <span className="flex items-center text-zinc-300"><ExternalLink size={14} className="mr-1.5" /> {selectedLead.contact.full_name}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-sm text-zinc-300">{selectedLead.startup.stage}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-sm text-zinc-300">{selectedLead.startup.market_vertical}</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-green-400 bg-green-950/30 border border-green-900/50 inline-flex px-4 py-2 rounded-sm">
                      <Calendar size={16} className="mr-2" />
                      Proposed Time: {selectedLead.proposed_time}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <a
                        href={selectedLead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                    >
                      <Linkedin size={16} className="mr-2" /> LinkedIn
                    </a>
                    <a
                        href={selectedLead.slush_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                    >
                      <MessageSquare size={16} className="mr-2" /> Slush Platform
                    </a>

                    <div className="w-full xl:w-auto h-px xl:h-auto xl:border-l border-zinc-800 my-2 xl:my-0 xl:mx-2"></div>

                    <button
                        onClick={() => handleAction(selectedLead.id, "declined")}
                        className="flex items-center px-5 py-3 border border-zinc-700 rounded-sm text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                    >
                      <X size={16} className="mr-2" /> Pass
                    </button>
                    <button
                        onClick={() => handleAction(selectedLead.id, "accepted")}
                        className="flex items-center px-6 py-3 bg-green-500 text-black rounded-sm hover:bg-green-400 transition-all font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    >
                      <Check size={16} className="mr-2" /> Accept Meeting
                    </button>
                  </div>
                </div>

                {/* AI Fit Analysis Card */}
                <div className="bg-zinc-900/40 backdrop-blur-md rounded-sm border border-zinc-800 overflow-hidden mb-10 shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>

                  <div className="bg-zinc-950/80 px-8 py-5 flex justify-between items-center border-b border-zinc-800/50">
                    <h3 className="text-white font-bold uppercase tracking-widest flex items-center text-sm">
                      <TrendingUp size={18} className="mr-3 text-green-500" />
                      Synthesis Engine
                    </h3>
                    <div className="flex flex-col items-end">
                  <span className={`text-4xl font-black tracking-tighter leading-none ${
                      selectedLead.match_score >= 70 ? "text-green-500" : selectedLead.match_score >= 50 ? "text-yellow-400" : "text-red-500"
                  }`}>
                    {selectedLead.match_score} <span className="text-zinc-600 text-sm font-normal tracking-normal">/100</span>
                  </span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Match Score</span>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-10">
                      <h4 className="text-xs font-black text-green-500 uppercase tracking-widest mb-5 flex items-center">
                        <Check size={16} className="mr-2" /> Verified Signals
                      </h4>
                      <ul className="space-y-3">
                        {selectedLead.positive_drivers.map((driver, idx) => (
                            <li key={idx} className="text-zinc-300 bg-black/60 p-4 rounded-sm border border-zinc-800 text-sm font-medium leading-relaxed flex items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 shrink-0"></div>
                              {driver}
                            </li>
                        ))}
                      </ul>
                    </div>

                    {selectedLead.red_flags.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-5 flex items-center">
                            <AlertTriangle size={16} className="mr-2" /> Critical Mismatches
                          </h4>
                          <ul className="space-y-3">
                            {selectedLead.red_flags.map((flag, idx) => (
                                <li key={idx} className="text-zinc-300 bg-red-950/10 p-4 rounded-sm border border-red-900/30 text-sm font-medium leading-relaxed flex items-start">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3 shrink-0"></div>
                                  {flag}
                                </li>
                            ))}
                          </ul>
                        </div>
                    )}
                  </div>
                </div>

                {/* Raw Pitch Context */}
                <div className="bg-zinc-900/30 rounded-sm border border-zinc-800/80 p-8">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center">
                    <Clock size={14} className="text-zinc-600 mr-2" /> Raw Slush Inbound Pitch
                  </h4>
                  <p className="text-zinc-300 font-serif italic border-l-2 border-green-500 pl-6 py-2 text-xl leading-relaxed opacity-90">
                    "{selectedLead.pitch}"
                  </p>
                </div>
              </div>
          ) : (
              <div className="h-full flex items-center justify-center text-zinc-700 font-black uppercase tracking-widest text-sm">
                Select an entity to initialize analysis
              </div>
          )}
        </div>

        {/* QUESTIONNAIRE / THESIS MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-950 rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 p-8 md:p-10 custom-scrollbar relative">

                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="text-green-500 animate-pulse" size={28} />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {isFirstTime ? "Initialize Thesis" : "Reconfigure Thesis"}
                    </h2>
                  </div>
                  {!isFirstTime && (
                      <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 p-2 rounded-sm">
                        <X size={20} />
                      </button>
                  )}
                </div>

                {!isFirstTime && (
                    <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-sm p-4 mb-10 flex items-start text-xs text-yellow-200 font-medium">
                      <AlertTriangle size={18} className="mr-3 flex-shrink-0 text-yellow-500 mt-0.5" />
                      <span className="leading-relaxed">
                  <strong className="text-white uppercase tracking-widest block mb-1">System Warning</strong>
                  Modifying the thesis will trigger a bulk re-evaluation of all pending requests. Processing via LLM pipeline may take several moments.
                </span>
                    </div>
                )}

                <div className="space-y-12 text-sm">

                  {/* --- SECTION: PRE-FILTERS --- */}
                  <div className="p-8 bg-black border border-zinc-800 rounded-sm shadow-inner">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center">
                      <Filter size={16} className="mr-3 text-zinc-600" /> Hard Pre-Filters (Bypass LLM)
                    </h3>

                    {/* Stage */}
                    <div className="mb-10">
                      <label className="font-bold text-white uppercase tracking-widest text-xs block mb-4">
                        Target Stages
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {["Idea", "Pre-Seed", "Seed", "Series A", "Series B+"].map((stage) => {
                          const active = tempSettings.stages?.includes(stage);
                          return (
                              <button
                                  key={stage}
                                  type="button"
                                  onClick={() => toggleArrayItem("stages", stage)}
                                  className={`px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                                      active
                                          ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                          : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                                  }`}
                              >
                                {stage}
                              </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Traction */}
                    <div>
                      <label className="font-bold text-white uppercase tracking-widest text-xs block mb-4">
                        Minimum Required Traction
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {["Idea / Pre-Product", "MVP / Alpha Live", "Early Revenue ($5k+)", "Growth / Scaling ($50k+)"].map((traction) => {
                          const active = tempSettings.minTraction === traction;
                          return (
                              <button
                                  key={traction}
                                  type="button"
                                  onClick={() => setTempSettings({ ...tempSettings, minTraction: traction })}
                                  className={`px-5 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all text-left ${
                                      active
                                          ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                          : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                                  }`}
                              >
                                {traction}
                              </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* --- LLM CRITERIA --- */}
                  <div className="pt-2">
                    <h3 className="text-xs font-black text-green-500 uppercase tracking-widest mb-8 flex items-center">
                      <TrendingUp size={16} className="mr-3" /> LLM Scoring Weights
                    </h3>

                    <div className="space-y-10 pl-2">
                      {/* Core Focus Verticals (TEXT INPUT) */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-widest text-xs block mb-2">
                          Core Verticals <span className="text-green-500 ml-2">(Positive Bias)</span>
                        </label>
                        <p className="text-[10px] text-zinc-500 mb-4 uppercase tracking-widest">
                          Enter target sectors separated by commas:
                        </p>
                        <input
                            type="text"
                            value={tempSettings.coreSectors}
                            onChange={(e) => setTempSettings({ ...tempSettings, coreSectors: e.target.value })}
                            placeholder="e.g., B2B SaaS, Dev Tools, Industrial AI"
                            className="w-full px-5 py-4 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-green-500 font-medium tracking-widest rounded-sm transition-colors"
                        />
                      </div>

                      {/* Disqualified Verticals (TEXT INPUT) */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-widest text-xs block mb-2">
                          Excluded Sectors <span className="text-red-500 ml-2">(Auto-Flag)</span>
                        </label>
                        <p className="text-[10px] text-zinc-500 mb-4 uppercase tracking-widest">
                          Enter sectors to automatically downrank, separated by commas:
                        </p>
                        <input
                            type="text"
                            value={tempSettings.excludedSectors}
                            onChange={(e) => setTempSettings({ ...tempSettings, excludedSectors: e.target.value })}
                            placeholder="e.g., Crypto, D2C, Web3, Pure Consulting"
                            className="w-full px-5 py-4 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-red-500 font-medium tracking-widest rounded-sm transition-colors"
                        />
                      </div>

                      {/* Geographies */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-widest text-xs block mb-4">
                          Geographic Mandate
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {["Nordics & Baltics", "Western Europe / UK", "US / North America", "Global / Anywhere"].map((geo) => {
                            const active = tempSettings.geographies?.includes(geo);
                            return (
                                <button
                                    key={geo}
                                    type="button"
                                    onClick={() => toggleArrayItem("geographies", geo)}
                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border rounded-sm ${
                                        active
                                            ? "bg-green-500/10 text-green-400 border-green-500/50"
                                            : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                  {geo}
                                </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Founder Archetypes */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-widest text-xs block mb-4">
                          Founder Pedigree Preferences
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { id: "technical_depth", label: "Technical (CS / Staff Eng)" },
                            { id: "scaleup_alumni", label: "Scaleup Alumni (Wolt, etc.)" },
                            { id: "repeat_founder", label: "Repeat Founder / Prior Exit" },
                            { id: "domain_operator", label: "Deep Domain Operator (5+ yrs)" }
                          ].map((arch) => {
                            const active = tempSettings.founderArchetypes?.includes(arch.id);
                            return (
                                <button
                                    key={arch.id}
                                    type="button"
                                    onClick={() => toggleArrayItem("founderArchetypes", arch.id)}
                                    className={`p-4 text-left text-[10px] font-bold uppercase tracking-widest transition-all border rounded-sm ${
                                        active
                                            ? "bg-green-500/5 border-green-500/50 text-green-400"
                                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                >
                                  {arch.label}
                                </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Benchmark Companies */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-widest text-xs block mb-2">
                          Dream Portfolio Benchmarks
                        </label>
                        <p className="text-[10px] text-zinc-500 mb-4 uppercase tracking-widest">
                          Provide examples for LLM few-shot grounding:
                        </p>
                        <input
                            type="text"
                            value={tempSettings.benchmarkCompanies}
                            onChange={(e) => setTempSettings({ ...tempSettings, benchmarkCompanies: e.target.value })}
                            placeholder="e.g., FlowLog, Supermetrics"
                            className="w-full px-5 py-4 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-green-500 font-medium tracking-widest rounded-sm transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800 flex justify-end space-x-4">
                  {!isFirstTime && (
                      <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-8 py-3 border border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm"
                      >
                        Abort
                      </button>
                  )}
                  <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-10 py-3 bg-green-500 text-black hover:bg-green-400 text-[10px] font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] rounded-sm"
                  >
                    {isFirstTime ? "Initialize Engine" : "Execute Re-rank"}
                  </button>
                </div>

              </div>
            </div>
        )}

        {/* Tailwind global overrides for custom scrollbar */}
        <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }
      `}} />
      </div>
  );
}