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
  MessageSquare,
  UserSearch
} from "lucide-react";

// --- INLINE ICONS ---
// Used to prevent missing export errors from varying lucide-react versions
const LinkedinIcon = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
);

// --- TYPES & DEFAULTS ---
interface QuestionnaireSettings {
  stages: string[];
  geographies: string[];
  coreSectors: string;
  excludedSectors: string;
  founderArchetypes: string[];
  benchmarkCompanies: string;
}

const defaultCriteria: QuestionnaireSettings = {
  stages: ["Pre-Seed", "Seed"],
  geographies: ["Nordics & Baltics", "Western Europe / UK"],
  coreSectors: "",
  excludedSectors: "",
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
    proposed_time: "Nov 30, 14:00 - 14:15",
    linkedin_url: "https://linkedin.com/in/martalindqvist",
    slush_url: "https://platform.slush.org/meetings/4412",
    linkedin_analysis: "Marta possesses a strong technical pedigree, having previously served as a Staff Engineer at Spotify for 4 years where she scaled edge microservices. Her educational background includes an M.Sc. in Computer Science from KTH Royal Institute of Technology. The co-founding team heavily indexes on engineering talent with direct experience building in the target market.",
    verdict: "High Priority. Direct thesis match with exceptional technical founder pedigree and proven capability in the B2B SaaS developer tools space.",
    pitch: "Hi! We saw your focus on developer platforms. We're an ex-Spotify engineering team scaling FlowLog past $25k MRR. Would love to grab 15 mins at Slush to share our seed deck."
  },
  {
    id: "req_slush_4413",
    contact: { full_name: "Johannes Virtanen", location: "Helsinki, Finland" },
    startup: { name: "RetailNode", stage: "Series A", market_vertical: "D2C / E-commerce", raised: "$2.1M" },
    match_score: 34,
    status: "pending",
    proposed_time: "Dec 1, 10:30 - 10:45",
    linkedin_url: "https://linkedin.com/in/johannesv",
    slush_url: "https://platform.slush.org/meetings/4413",
    linkedin_analysis: "Johannes has a background in digital marketing and agency consulting. Previous roles include Head of Marketing at a mid-sized retail brand. No technical co-founders are listed on the immediate team. Experience is heavily concentrated in D2C and consumer retail rather than enterprise software.",
    verdict: "Pass. Significant thesis mismatch. D2C / E-commerce falls into the excluded verticals, and the Series A stage is outside the core Pre-Seed/Seed mandate.",
    pitch: "Looking to connect with investors for our Series A expansion into the UK market."
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

  // Robust localStorage parsing with deep-merge fallback to prevent crashes
  useEffect(() => {
    const saved = localStorage.getItem("vc_slush_criteria_v2");
    if (!saved) {
      setIsFirstTime(true);
      setIsModalOpen(true);
    } else {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultCriteria, ...parsed };

        // Ensure arrays remain arrays
        if (!Array.isArray(merged.stages)) merged.stages = defaultCriteria.stages;
        if (!Array.isArray(merged.geographies)) merged.geographies = defaultCriteria.geographies;
        if (!Array.isArray(merged.founderArchetypes)) merged.founderArchetypes = defaultCriteria.founderArchetypes;

        setSettings(merged);
        setTempSettings(merged);
      } catch (e) {
        console.error("Settings parse error, falling back to defaults", e);
        setIsFirstTime(true);
        setIsModalOpen(true);
      }
    }
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleAction = (id: string, action: "accepted" | "declined") => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: action } : lead));
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem("vc_slush_criteria_v2", JSON.stringify(tempSettings));
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
    const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
    setTempSettings({ ...tempSettings, [key]: updated });
  };

  return (
      <div className="flex h-screen bg-black font-sans text-zinc-100 selection:bg-lime-500 selection:text-black">

        {/* LEFT PANEL: INBOX / LIST */}
        <div className="w-1/3 border-r border-zinc-800 bg-zinc-950 flex flex-col z-20">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 sticky top-0">
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white">Slush<span className="text-lime-400">_</span>Triage</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Live Deal Flow</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                  onClick={() => {
                    setTempSettings(settings);
                    setIsModalOpen(true);
                  }}
                  className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-lime-400 transition-colors"
                  title="Edit Scoring Thesis"
              >
                <SlidersHorizontal size={18} />
              </button>
              <span className="bg-lime-500/10 text-lime-400 border border-lime-500/20 text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide">
              {leads.filter(l => l.status === 'pending').length} Pending
            </span>
            </div>
          </div>

          {isReranking && (
              <div className="bg-lime-950/40 border-b border-lime-900/50 p-3 flex items-center text-xs text-lime-400 uppercase tracking-wider font-bold">
                <RotateCw size={14} className="animate-spin mr-2 flex-shrink-0" />
                <span>Recalculating Match Scores...</span>
              </div>
          )}

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {leads.map((lead) => (
                <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-5 border-b border-zinc-900 cursor-pointer transition-all duration-200 ${
                        selectedLeadId === lead.id
                            ? "bg-zinc-900 border-l-4 border-l-lime-400"
                            : "hover:bg-zinc-900/50 border-l-4 border-l-transparent"
                    }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-bold text-lg tracking-tight">{lead.startup.name}</h3>
                    <span className={`text-sm font-black tracking-tighter flex items-center ${
                        lead.match_score >= 70 ? "text-lime-400" : lead.match_score >= 50 ? "text-yellow-400" : "text-rose-500"
                    }`}>
                  {lead.match_score} <span className="text-zinc-600 text-xs ml-0.5">/100</span>
                </span>
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">{lead.contact.full_name} <span className="text-zinc-600 mx-1">•</span> {lead.startup.stage}</p>

                  {lead.status !== 'pending' && (
                      <div className="mt-3 flex">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                      lead.status === 'accepted' ? "bg-lime-500/20 text-lime-400 border border-lime-500/30" : "bg-zinc-800 text-zinc-500"
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
        <div className="w-2/3 bg-black overflow-y-auto relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

          {selectedLead ? (
              <div className="max-w-4xl mx-auto p-10 relative z-10">

                {/* Header Area */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-3 uppercase">{selectedLead.startup.name}</h2>
                    <div className="flex items-center space-x-3 text-sm text-zinc-400 font-medium tracking-wide">
                      <a href={selectedLead.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center hover:text-lime-400 cursor-pointer transition-colors">
                        <ExternalLink size={16} className="mr-1.5" /> {selectedLead.contact.full_name}
                      </a>
                      <span className="text-zinc-700">•</span>
                      <span className="bg-zinc-900 px-2 py-1 rounded text-zinc-300">{selectedLead.startup.stage}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="bg-zinc-900 px-2 py-1 rounded text-zinc-300">{selectedLead.startup.market_vertical}</span>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                        onClick={() => handleAction(selectedLead.id, "declined")}
                        className="flex items-center px-5 py-2.5 border border-zinc-700 rounded-sm text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-500 transition-all font-bold uppercase tracking-wider text-sm"
                    >
                      <X size={18} className="mr-2" /> Pass
                    </button>
                    <button
                        onClick={() => handleAction(selectedLead.id, "accepted")}
                        className="flex items-center px-5 py-2.5 bg-lime-500 text-black rounded-sm hover:bg-lime-400 transition-all font-bold uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(132,204,22,0.4)]"
                    >
                      <Check size={18} className="mr-2" /> Accept
                    </button>
                  </div>
                </div>

                {/* Quick Actions & Info Bar */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-sm px-4 py-2 text-sm font-medium text-zinc-300">
                    <Calendar size={16} className="text-lime-400 mr-2" />
                    {selectedLead.proposed_time}
                  </div>

                  <a href={selectedLead.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center bg-[#0a66c2]/10 border border-[#0a66c2]/30 hover:bg-[#0a66c2]/20 rounded-sm px-4 py-2 text-sm font-bold text-[#0a66c2] transition-colors">
                    <LinkedinIcon size={16} className="mr-2" />
                    View Profile
                  </a>

                  <a href={selectedLead.slush_url} target="_blank" rel="noreferrer" className="flex items-center bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-sm px-4 py-2 text-sm font-bold text-white transition-colors">
                    <MessageSquare size={16} className="mr-2 text-zinc-400" />
                    Open Platform Thread
                  </a>
                </div>

                {/* AI Synthesis & LinkedIn Analysis Card */}
                <div className="bg-zinc-900/80 backdrop-blur-md rounded-sm border border-zinc-800 overflow-hidden mb-8 shadow-2xl">
                  <div className="bg-zinc-950 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
                    <h3 className="text-white font-bold uppercase tracking-widest flex items-center text-sm">
                      <TrendingUp size={18} className="mr-2 text-lime-400" />
                      AI Synthesis
                    </h3>
                    <span className="text-lime-400 text-2xl font-black tracking-tighter">
                  {selectedLead.match_score} <span className="text-zinc-600 text-sm font-normal tracking-normal">/100</span>
                </span>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-lime-400 uppercase tracking-widest mb-3 flex items-center">
                        <UserSearch size={16} className="mr-2" /> LinkedIn Analysis
                      </h4>
                      <p className="text-zinc-300 bg-black/50 p-4 rounded-sm border border-zinc-800 text-sm font-medium leading-relaxed">
                        {selectedLead.linkedin_analysis}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center">
                        <Check size={16} className="text-lime-400 mr-2" /> Verdict
                      </h4>
                      <p className="text-zinc-300 bg-lime-950/10 p-4 rounded-sm border border-lime-900/30 text-sm font-medium leading-relaxed">
                        {selectedLead.verdict}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Raw Pitch Context */}
                <div className="bg-zinc-900/50 rounded-sm border border-zinc-800 p-6">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center">
                    <Clock size={16} className="text-zinc-600 mr-2" /> Raw Slush Platform Inbound
                  </h4>
                  <p className="text-zinc-300 font-serif italic border-l-2 border-lime-400 pl-5 py-2 text-lg leading-relaxed">
                    "{selectedLead.pitch}"
                  </p>
                </div>
              </div>
          ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest">
                Select a lead to initialize analysis
              </div>
          )}
        </div>

        {/* QUESTIONNAIRE / THESIS MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-zinc-950 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 p-8 custom-scrollbar">

                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="text-lime-400" size={24} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      {isFirstTime ? "Initialize Investment Thesis" : "Reconfigure Thesis"}
                    </h2>
                  </div>
                  {!isFirstTime && (
                      <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                      </button>
                  )}
                </div>

                {!isFirstTime && (
                    <div className="bg-amber-950/30 border border-amber-900/50 rounded-sm p-4 mb-8 flex items-start text-xs text-amber-200 font-medium">
                      <AlertTriangle size={16} className="mr-3 flex-shrink-0 text-amber-500 mt-0.5" />
                      <span className="leading-relaxed">
                  <strong className="text-white uppercase tracking-wider block mb-1">System Warning</strong>
                  Modifying the thesis will trigger a bulk re-evaluation of all pending requests. Processing via Apify and LLM may take a few moments.
                </span>
                    </div>
                )}

                <div className="space-y-10 text-sm">

                  {/* --- NEW SECTION: PRE-FILTERS --- */}
                  <div className="p-6 bg-black border border-zinc-800 rounded-sm">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center">
                      <Filter size={16} className="mr-2" /> Hard Pre-Filters (Bypass LLM)
                    </h3>

                    {/* Stage */}
                    <div className="mb-8">
                      <label className="font-bold text-white uppercase tracking-wide block mb-3">
                        Target Stages
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {["Idea", "Pre-Seed", "Seed", "Series A", "Series B+"].map((stage) => {
                          const active = tempSettings.stages.includes(stage);
                          return (
                              <button
                                  key={stage}
                                  type="button"
                                  onClick={() => toggleArrayItem("stages", stage)}
                                  className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                                      active
                                          ? "bg-lime-500 text-black shadow-[0_0_10px_rgba(132,204,22,0.3)]"
                                          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                  }`}
                              >
                                {stage}
                              </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Geographies (Moved to Pre-Filter) */}
                    <div>
                      <label className="font-bold text-white uppercase tracking-wide block mb-3">
                        Geographic Mandate
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {["Nordics & Baltics", "Western Europe / UK", "US / North America", "Global / Anywhere"].map((geo) => {
                          const active = tempSettings.geographies.includes(geo);
                          return (
                              <button
                                  key={geo}
                                  type="button"
                                  onClick={() => toggleArrayItem("geographies", geo)}
                                  className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                                      active
                                          ? "bg-lime-500 text-black shadow-[0_0_10px_rgba(132,204,22,0.3)]"
                                          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                  }`}
                              >
                                {geo}
                              </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* --- EXISTING LLM CRITERIA --- */}
                  <div className="pt-4 border-t border-zinc-800/50">
                    <h3 className="text-xs font-black text-lime-400 uppercase tracking-widest mb-6 flex items-center">
                      <TrendingUp size={16} className="mr-2" /> LLM Scoring Weights
                    </h3>

                    <div className="space-y-8">

                      {/* Core Focus Verticals (Text Input) */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-wide block mb-2">
                          Core Verticals (Positive Score Bias)
                        </label>
                        <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                          Provide a comma-separated list of target sectors.
                        </p>
                        <input
                            type="text"
                            value={tempSettings.coreSectors}
                            onChange={(e) => setTempSettings({ ...tempSettings, coreSectors: e.target.value })}
                            placeholder="E.G. B2B SAAS, DEVELOPER TOOLS, DEEPTECH"
                            className="w-full px-4 py-3 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 font-medium uppercase tracking-wider"
                        />
                      </div>

                      {/* Disqualified Verticals (Text Input) */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-wide block mb-2">
                          Excluded Sectors (Auto-Flag / Low Score)
                        </label>
                        <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                          Provide a comma-separated list of automatic pass sectors.
                        </p>
                        <input
                            type="text"
                            value={tempSettings.excludedSectors}
                            onChange={(e) => setTempSettings({ ...tempSettings, excludedSectors: e.target.value })}
                            placeholder="E.G. CRYPTO, D2C E-COMMERCE, GAMBLING"
                            className="w-full px-4 py-3 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 font-medium uppercase tracking-wider"
                        />
                      </div>

                      {/* Founder Archetypes */}
                      <div>
                        <label className="font-bold text-white uppercase tracking-wide block mb-3">
                          Founder Pedigree Pref (via LinkedIn)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "technical_depth", label: "Technical (CS / Staff Eng)" },
                            { id: "scaleup_alumni", label: "Scaleup Alumni (Wolt, etc.)" },
                            { id: "repeat_founder", label: "Repeat Founder / Prior Exit" },
                            { id: "domain_operator", label: "Deep Domain Operator (5+ yrs)" }
                          ].map((arch) => {
                            const active = tempSettings.founderArchetypes.includes(arch.id);
                            return (
                                <button
                                    key={arch.id}
                                    type="button"
                                    onClick={() => toggleArrayItem("founderArchetypes", arch.id)}
                                    className={`p-3 text-left text-xs font-bold uppercase tracking-wider transition-all border ${
                                        active
                                            ? "bg-lime-500/10 border-lime-500/50 text-lime-400"
                                            : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
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
                        <label className="font-bold text-white uppercase tracking-wide block mb-2">
                          Dream Portfolio Benchmarks
                        </label>
                        <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
                          Provide 1-2 examples of ideal investments for few-shot LLM grounding:
                        </p>
                        <input
                            type="text"
                            value={tempSettings.benchmarkCompanies}
                            onChange={(e) => setTempSettings({ ...tempSettings, benchmarkCompanies: e.target.value })}
                            placeholder="E.G. FLOWLOG, SUPERMETRICS"
                            className="w-full px-4 py-3 bg-black border border-zinc-800 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 font-medium uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-end space-x-4">
                  {!isFirstTime && (
                      <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-6 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        Abort
                      </button>
                  )}
                  <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-8 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #09090b; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }
      `}} />
      </div>
  );
}