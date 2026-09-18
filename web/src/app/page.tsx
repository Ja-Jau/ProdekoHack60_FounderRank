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
  Sparkles
} from "lucide-react";

interface QuestionnaireSettings {
  coreSectors: string[];
  excludedSectors: string[];
  geographies: string[];
  founderArchetypes: string[];
  benchmarkCompanies: string;
}

const defaultCriteria: QuestionnaireSettings = {
  coreSectors: ["B2B SaaS", "Developer Tools"],
  excludedSectors: ["Crypto / Web3", "D2C"],
  geographies: ["Nordics & Baltics", "Western Europe / UK"],
  founderArchetypes: ["technical_depth", "scaleup_alumni"],
  benchmarkCompanies: "FlowLog, Supermetrics"
};

const mockLeads = [
  {
    id: "req_slush_4412",
    contact: { full_name: "Marta Lindqvist", location: "Stockholm, Sweden" },
    startup: { name: "FlowLog", stage: "Seed", market_vertical: "Developer Tools", raised: "$650k" },
    match_score: 88,
    status: "pending",
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
    positive_drivers: ["Strong domestic traction."],
    red_flags: [
      "Excluded sector match: D2C / E-commerce is on your pass list.",
      "Outside primary investment stage focus."
    ],
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

  useEffect(() => {
    const saved = localStorage.getItem("vc_slush_criteria");
    if (!saved) {
      setIsFirstTime(true);
      setIsModalOpen(true);
    } else {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        setTempSettings(parsed);
      } catch (e) {
        console.error(e);
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
      // Trigger re-ranking indicator
      setIsReranking(true);
      setTimeout(() => {
        setIsReranking(false);
      }, 3000);
    } else {
      setIsFirstTime(false);
    }
  };

  const toggleArrayItem = (key: "coreSectors" | "excludedSectors" | "geographies" | "founderArchetypes", value: string) => {
    const current = tempSettings[key];
    const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
    setTempSettings({ ...tempSettings, [key]: updated });
  };

  return (
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">

        {/* LEFT PANEL: INBOX / LIST */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Slush Deal Flow</h1>
              <p className="text-xs text-gray-500">Live Inbound Queue</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                  onClick={() => {
                    setTempSettings(settings);
                    setIsModalOpen(true);
                  }}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  title="Edit Scoring Thesis"
              >
                <SlidersHorizontal size={18} />
              </button>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {leads.filter(l => l.status === 'pending').length} Pending
            </span>
            </div>
          </div>

          {/* Re-ranking Notification Banner */}
          {isReranking && (
              <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center text-xs text-amber-800">
                <RotateCw size={14} className="animate-spin mr-2 flex-shrink-0" />
                <span>Updating criteria... Apify workers and LLM re-ranking profiles.</span>
              </div>
          )}

          {/* Leads Scroll Area */}
          <div className="overflow-y-auto flex-1">
            {leads.map((lead) => (
                <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedLeadId === lead.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold">{lead.startup.name}</h3>
                    <span className={`text-sm font-bold flex items-center ${
                        lead.match_score >= 70 ? "text-green-600" : lead.match_score >= 50 ? "text-yellow-600" : "text-red-600"
                    }`}>
                  {lead.match_score} / 100
                </span>
                  </div>
                  <p className="text-sm text-gray-600">{lead.contact.full_name} • {lead.startup.stage}</p>

                  {lead.status !== 'pending' && (
                      <div className="mt-2 flex">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      lead.status === 'accepted' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {lead.status === 'accepted' ? 'Accepted' : 'Passed'}
                  </span>
                      </div>
                  )}
                </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: DETAILS & TRIAGE */}
        <div className="w-2/3 bg-gray-50 overflow-y-auto">
          {selectedLead ? (
              <div className="max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedLead.startup.name}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center"><ExternalLink size={16} className="mr-1" /> {selectedLead.contact.full_name}</span>
                      <span>•</span>
                      <span>{selectedLead.startup.stage}</span>
                      <span>•</span>
                      <span>{selectedLead.startup.market_vertical}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                        onClick={() => handleAction(selectedLead.id, "declined")}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors bg-white font-medium shadow-sm"
                    >
                      <X size={18} className="mr-2" /> Pass
                    </button>
                    <button
                        onClick={() => handleAction(selectedLead.id, "accepted")}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      <Check size={18} className="mr-2" /> Accept Meeting
                    </button>
                  </div>
                </div>

                {/* AI Fit Analysis Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-medium flex items-center">
                      <TrendingUp size={18} className="mr-2 text-blue-400" />
                      AI Fit Analysis
                    </h3>
                    <span className="text-white text-xl font-bold bg-slate-800 px-3 py-1 rounded-md">
                  {selectedLead.match_score} <span className="text-slate-400 text-sm font-normal">/100</span>
                </span>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <Check size={16} className="text-green-500 mr-2" /> Key Positives
                      </h4>
                      <ul className="space-y-2">
                        {selectedLead.positive_drivers.map((driver, idx) => (
                            <li key={idx} className="text-gray-700 bg-green-50/50 p-3 rounded-md border border-green-100 text-sm">
                              {driver}
                            </li>
                        ))}
                      </ul>
                    </div>

                    {selectedLead.red_flags.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <AlertTriangle size={16} className="text-red-500 mr-2" /> Red Flags & Mismatches
                          </h4>
                          <ul className="space-y-2">
                            {selectedLead.red_flags.map((flag, idx) => (
                                <li key={idx} className="text-gray-700 bg-red-50/50 p-3 rounded-md border border-red-100 text-sm">
                                  {flag}
                                </li>
                            ))}
                          </ul>
                        </div>
                    )}
                  </div>
                </div>

                {/* Raw Pitch Context */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <Clock size={16} className="text-gray-400 mr-2" /> Slush Platform Message
                  </h4>
                  <p className="text-gray-700 italic border-l-4 border-gray-200 pl-4 py-1 text-sm leading-relaxed">
                    "{selectedLead.pitch}"
                  </p>
                </div>
              </div>
          ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a lead from the queue to view details
              </div>
          )}
        </div>

        {/* QUESTIONNAIRE / THESIS MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6">

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-blue-600" size={24} />
                    <h2 className="text-xl font-bold text-gray-900">
                      {isFirstTime ? "Define Your Slush Investment Thesis" : "Edit Investment Thesis"}
                    </h2>
                  </div>
                  {!isFirstTime && (
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                      </button>
                  )}
                </div>

                {/* Warning banner when updating */}
                {!isFirstTime && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start text-xs text-amber-800">
                      <AlertTriangle size={16} className="mr-2 flex-shrink-0 text-amber-600 mt-0.5" />
                      <span>
                  <strong>Heads up:</strong> Saving new criteria will trigger a background re-evaluation of all queued inbound requests. It will take a short while to recalculate rankings.
                </span>
                    </div>
                )}

                <div className="space-y-6 text-sm">

                  {/* 1. Core Focus Verticals */}
                  <div>
                    <label className="font-semibold text-gray-900 block mb-2">
                      1. Core Verticals (Strong Positive Bias)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["B2B SaaS", "Developer Tools", "AI / ML Infrastructure", "DeepTech", "Industrial / Climate", "Fintech"].map((sector) => {
                        const active = tempSettings.coreSectors.includes(sector);
                        return (
                            <button
                                key={sector}
                                type="button"
                                onClick={() => toggleArrayItem("coreSectors", sector)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                }`}
                            >
                              {sector}
                            </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Disqualified / Excluded Verticals */}
                  <div>
                    <label className="font-semibold text-gray-900 block mb-2">
                      2. Excluded Verticals (Automatic Low Score / Flag)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Crypto / Web3", "D2C", "Biotech / Pharma", "Pure Consulting", "Gambling"].map((sector) => {
                        const active = tempSettings.excludedSectors.includes(sector);
                        return (
                            <button
                                key={sector}
                                type="button"
                                onClick={() => toggleArrayItem("excludedSectors", sector)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    active
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                }`}
                            >
                              {sector}
                            </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Geography Mandates */}
                  <div>
                    <label className="font-semibold text-gray-900 block mb-2">
                      3. Geographic Focus
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Nordics & Baltics", "Western Europe / UK", "US / North America", "Global / Anywhere"].map((geo) => {
                        const active = tempSettings.geographies.includes(geo);
                        return (
                            <button
                                key={geo}
                                type="button"
                                onClick={() => toggleArrayItem("geographies", geo)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                }`}
                            >
                              {geo}
                            </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Founder Archetype */}
                  <div>
                    <label className="font-semibold text-gray-900 block mb-2">
                      4. Preferred Founder Pedigree (Scored via LinkedIn Experience)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "technical_depth", label: "Technical depth (CS degree / Ex-Staff Eng)" },
                        { id: "scaleup_alumni", label: "European Scaleup Alumni (Wolt, Spotify, etc.)" },
                        { id: "repeat_founder", label: "Repeat Founder / Prior Exit" },
                        { id: "domain_operator", label: "Deep Domain Operator (5+ yrs in vertical)" }
                      ].map((arch) => {
                        const active = tempSettings.founderArchetypes.includes(arch.id);
                        return (
                            <button
                                key={arch.id}
                                type="button"
                                onClick={() => toggleArrayItem("founderArchetypes", arch.id)}
                                className={`p-2.5 rounded-lg text-left text-xs font-medium border transition-colors ${
                                    active
                                        ? "bg-blue-50 border-blue-500 text-blue-900"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              {arch.label}
                            </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Benchmark Companies */}
                  <div>
                    <label className="font-semibold text-gray-900 block mb-1">
                      5. Dream Portfolio Benchmarks
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Provide 1-2 examples of companies or founders you backed or admired recently:
                    </p>
                    <input
                        type="text"
                        value={tempSettings.benchmarkCompanies}
                        onChange={(e) => setTempSettings({ ...tempSettings, benchmarkCompanies: e.target.value })}
                        placeholder="e.g. FlowLog, Supermetrics, Wolt"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  {!isFirstTime && (
                      <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                  )}
                  <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                  >
                    {isFirstTime ? "Save & Start Triaging" : "Save & Re-rank"}
                  </button>
                </div>

              </div>
            </div>
        )}

      </div>
  );
}