"use client";

import { useState } from "react";
import { Check, X, AlertTriangle, TrendingUp, ExternalLink, Clock } from "lucide-react";

// Mock data matching our previous schema - replace with Supabase fetch
const mockLeads = [
  {
    id: "req_slush_4412",
    contact: { full_name: "Marta Lindqvist", location: "Stockholm, Sweden" },
    startup: { name: "FlowLog", stage: "Seed", market_vertical: "Dev Tools", raised: "$650k" },
    match_score: 88,
    status: "pending",
    positive_drivers: [
      "Technical founder pedigree: Ex-Staff Engineer at Spotify.",
      "Direct thesis match: Building in B2B dev tools.",
      "Demonstrated commercial validation with $25k stated MRR."
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
    positive_drivers: ["Strong traction in domestic markets."],
    red_flags: [
      "Wrong stage (Series A vs fund focus of Pre-Seed/Seed).",
      "Sector mismatch (D2C E-commerce is on the excluded list)."
    ],
    pitch: "Looking to connect with investors for our Series A expansion into the UK market."
  }
];

export default function SlushTriageDashboard() {
  const [leads, setLeads] = useState(mockLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(mockLeads[0].id);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleAction = (id: string, action: "accepted" | "declined") => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: action } : lead));
    // Here you would trigger an update via your lib/supabase.ts client
  };

  return (
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">

        {/* LEFT PANEL: INBOX / LIST */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
            <h1 className="text-xl font-bold tracking-tight">Slush Deal Flow</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {leads.filter(l => l.status === 'pending').length} Pending
          </span>
          </div>

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

                  {/* Status Badge */}
                  {lead.status !== 'pending' && (
                      <div className="mt-2 flex">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
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

                {/* Header section */}
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

                {/* AI Evaluation Card */}
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
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                        <Check size={16} className="text-green-500 mr-2" /> Key Strengths
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
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
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
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                    <Clock size={16} className="text-gray-400 mr-2" /> Original Slush Message
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
      </div>
  );
}