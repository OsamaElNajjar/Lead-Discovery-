/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  Download, 
  Mail, 
  MessageSquare, 
  ExternalLink, 
  Star, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { searchLeads, editMarketingImage } from './services/gemini';
import { Lead, SearchFilters } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  const [view, setView] = useState<'search' | 'results' | 'mockup'>('search');
  
  // Form state
  const [industry, setIndustry] = useState("Dental clinics");
  const [location, setLocation] = useState("Dubai");
  const [maxRating, setMaxRating] = useState(4.0);
  const [minReviews, setMinReviews] = useState(5);
  const [mustHaveWebsite, setMustHaveWebsite] = useState(false);
  const [mustHavePhone, setMustHavePhone] = useState(true);

  // Mockup state
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState("Add a professional 'Book Now' button and improve the lighting for a premium dental clinic look.");
  const [editingImage, setEditingImage] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filters: SearchFilters = {
        industry,
        location,
        maxRating,
        minReviews,
        mustHaveWebsite,
        mustHavePhone
      };
      const result = await searchLeads(filters);
      
      // If no leads were parsed but we have a response, we might need to show the raw text
      // or simulate if it's a demo
      if (result.leads.length === 0 && result.rawResponse) {
        // Fallback for demo if Gemini didn't return JSON
        console.log("Gemini returned text but no JSON. Showing raw response.");
      }
      
      setLeads(result.leads);
      setRawResponse(result.rawResponse);
      setView('results');
    } catch (error) {
      console.error(error);
      alert("Failed to fetch leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = Object.keys(leads[0]).join(",");
    const rows = leads.map(lead => 
      Object.values(lead).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leadhunter_export_${location.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOutreach = (lead: Lead) => {
    const email = `Subject: Improving ${lead.name}'s Online Reputation in ${lead.city}

Hi Team at ${lead.name},

I noticed your clinic in ${lead.area} has a few recent reviews that might be impacting your patient acquisition. With a ${lead.rating} star rating, you're missing out on significant local traffic.

We specialize in helping ${lead.category} businesses in the UAE fix their local SEO and reputation. 

Would you be open to a 5-minute chat about how we can get those reviews up and automate your patient feedback loop?

Best,
[Your Name]`;

    const whatsapp = `Hi ${lead.name} team! I'm reaching out from [Agency Name]. We're currently working with businesses in ${lead.area} to improve their Google Maps visibility. I noticed some opportunities for your profile to rank higher. Do you have a moment to chat?`;

    return { email, whatsapp };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMockupImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async () => {
    if (!mockupImage) return;
    setEditingImage(true);
    try {
      const edited = await editMarketingImage(mockupImage, mockupPrompt);
      setMockupImage(edited);
    } catch (error) {
      console.error(error);
      alert("Failed to edit image.");
    } finally {
      setEditingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 flex justify-between items-center sticky top-0 bg-[#E4E3E0] z-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          <h1 className="font-serif italic text-xl font-bold tracking-tight">BOND</h1>
          <span className="text-[10px] uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-full">UAE Agency Edition</span>
        </div>
        <nav className="flex gap-6 text-xs uppercase tracking-widest font-bold">
          <button onClick={() => setView('search')} className={cn("hover:opacity-50 transition-opacity", view === 'search' && "underline underline-offset-4")}>Search</button>
          <button onClick={() => setView('results')} className={cn("hover:opacity-50 transition-opacity", view === 'results' && "underline underline-offset-4")}>Leads ({leads.length})</button>
          <button onClick={() => setView('mockup')} className={cn("hover:opacity-50 transition-opacity", view === 'mockup' && "underline underline-offset-4")}>Mockup Lab</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-12 items-center py-12"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-7xl font-serif italic leading-[0.9] tracking-tighter">
                    Find the <br />
                    <span className="not-italic font-sans font-black uppercase text-8xl">Gap.</span>
                  </h2>
                  <p className="text-xl text-[#141414]/70 max-w-md">
                    Target businesses in the UAE with low ratings and weak online presence. Turn their problems into your agency's revenue.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-6 bg-white p-8 border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Industry</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                        <input 
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full bg-[#F5F5F5] border-b border-[#141414] p-3 pl-10 text-sm focus:outline-none"
                          placeholder="e.g. Dental Clinics"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                        <input 
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-[#F5F5F5] border-b border-[#141414] p-3 pl-10 text-sm focus:outline-none"
                          placeholder="e.g. Dubai Marina"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Max Rating ({maxRating})</label>
                      <input 
                        type="range" min="1" max="5" step="0.1"
                        value={maxRating}
                        onChange={(e) => setMaxRating(parseFloat(e.target.value))}
                        className="w-full accent-[#141414]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Min Reviews ({minReviews})</label>
                      <input 
                        type="range" min="0" max="500" step="5"
                        value={minReviews}
                        onChange={(e) => setMinReviews(parseInt(e.target.value))}
                        className="w-full accent-[#141414]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={mustHaveWebsite}
                        onChange={(e) => setMustHaveWebsite(e.target.checked)}
                        className="w-4 h-4 accent-[#141414]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider group-hover:opacity-70">Must have website</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={mustHavePhone}
                        onChange={(e) => setMustHavePhone(e.target.checked)}
                        className="w-4 h-4 accent-[#141414]"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider group-hover:opacity-70">Must have phone</span>
                    </label>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing UAE Market...
                      </>
                    ) : (
                      <>
                        Hunt Leads
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="hidden lg:block relative">
                <div className="absolute -inset-4 border border-[#141414] opacity-20 rotate-3"></div>
                <div className="absolute -inset-4 border border-[#141414] opacity-20 -rotate-3"></div>
                <img 
                  src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80&w=1000" 
                  alt="Dubai Skyline"
                  className="w-full h-[600px] object-cover border border-[#141414] grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-8 left-8 right-8 bg-white p-6 border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <p className="font-serif italic text-lg">"The best leads aren't the ones everyone is calling. They're the ones everyone is ignoring because of a bad review."</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end border-b border-[#141414] pb-6">
                <div>
                  <h2 className="text-4xl font-serif italic">Lead Discovery</h2>
                  <p className="text-sm opacity-50 uppercase tracking-widest font-bold">
                    {industry} in {location} • {leads.length} Opportunities Found
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button 
                    onClick={() => setView('search')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all"
                  >
                    New Search
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Table Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-[#141414] overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_100px] p-4 border-b border-[#141414] bg-[#F5F5F5] text-[10px] uppercase tracking-widest font-black">
                      <div>Business Name</div>
                      <div className="text-center">Rating</div>
                      <div className="text-center">Reviews</div>
                      <div className="text-right">Score</div>
                    </div>
                    <div className="divide-y divide-[#141414]/10 max-h-[600px] overflow-y-auto">
                      {leads.length > 0 ? leads.map((lead, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedLead(lead)}
                          className={cn(
                            "grid grid-cols-[1fr_80px_80px_100px] p-4 items-center cursor-pointer hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group",
                            selectedLead?.name === lead.name && "bg-[#141414] text-[#E4E3E0]"
                          )}
                        >
                          <div>
                            <div className="font-bold text-sm">{lead.name}</div>
                            <div className="text-[10px] opacity-50 uppercase tracking-wider">{lead.area}, {lead.city}</div>
                          </div>
                          <div className="text-center font-mono text-sm flex items-center justify-center gap-1">
                            {lead.rating}
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                          <div className="text-center font-mono text-sm opacity-50">{lead.reviews}</div>
                          <div className="text-right">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-black",
                              lead.leadScore > 80 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                            )}>
                              {lead.leadScore}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center space-y-4">
                          <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                          <p className="text-sm opacity-50">No leads found matching your criteria. Try broadening your search.</p>
                          {rawResponse && (
                            <div className="text-left bg-[#F5F5F5] p-4 text-xs font-mono border border-[#141414]/10 max-h-40 overflow-y-auto">
                              <Markdown>{rawResponse}</Markdown>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detail Section */}
                <div className="space-y-6">
                  {selectedLead ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-[#141414] p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] sticky top-24"
                    >
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-serif italic leading-tight">{selectedLead.name}</h3>
                            <a href={selectedLead.mapsUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">{selectedLead.category}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#141414]/10">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">Score Reason</p>
                            <p className="text-xs italic">"{selectedLead.scoreReason}"</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">Suggested Package</p>
                            <p className="text-xs font-bold text-emerald-600">{selectedLead.suggestedPackage}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Marketing Problems</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.marketingProblems.map((prob, i) => (
                              <span key={i} className="text-[10px] bg-[#F5F5F5] px-2 py-1 border border-[#141414]/10 font-bold">
                                {prob}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-[#141414] text-[#E4E3E0] space-y-2">
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Best Outreach Angle</p>
                            <p className="text-sm font-serif italic">"{selectedLead.outreachAngle}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                const { email } = generateOutreach(selectedLead);
                                navigator.clipboard.writeText(email);
                                alert("Email template copied!");
                              }}
                              className="flex items-center justify-center gap-2 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#F5F5F5] transition-all"
                            >
                              <Mail className="w-4 h-4" />
                              Copy Email
                            </button>
                            <button 
                              onClick={() => {
                                const { whatsapp } = generateOutreach(selectedLead);
                                navigator.clipboard.writeText(whatsapp);
                                alert("WhatsApp template copied!");
                              }}
                              className="flex items-center justify-center gap-2 py-3 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#F5F5F5] transition-all"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Copy WA
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#141414]/10 space-y-2">
                          <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Contact Info</p>
                          <div className="text-xs space-y-1">
                            <p>Phone: <span className="font-mono">{selectedLead.phone}</span></p>
                            <p>Email: <span className="font-mono">{selectedLead.email}</span></p>
                            <p>Web: <a href={selectedLead.website} target="_blank" rel="noreferrer" className="underline hover:opacity-50">{selectedLead.website}</a></p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-[#141414]/20 rounded-xl">
                      <ChevronRight className="w-12 h-12 opacity-10 mb-4" />
                      <p className="text-sm opacity-30 font-serif italic">Select a lead to view agency insights and outreach templates.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'mockup' && (
            <motion.div 
              key="mockup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8 py-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif italic">Mockup Lab</h2>
                <p className="text-sm opacity-50 uppercase tracking-widest font-bold">Generate visual proof of improvement for your pitch</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white border border-[#141414] p-6 space-y-4">
                    <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50">1. Upload Base Image (e.g. Website Screenshot)</label>
                    <div className="border-2 border-dashed border-[#141414]/20 rounded-lg p-8 text-center hover:bg-[#F5F5F5] transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-8 h-8 mx-auto opacity-20 mb-2" />
                      <p className="text-xs opacity-50">Click to upload or drag & drop</p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#141414] p-6 space-y-4">
                    <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50">2. Improvement Prompt</label>
                    <textarea 
                      value={mockupPrompt}
                      onChange={(e) => setMockupPrompt(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#141414]/10 p-4 text-sm focus:outline-none h-32 resize-none"
                      placeholder="e.g. Add a modern hero section with a 'Book Now' button..."
                    />
                    <button 
                      disabled={!mockupImage || editingImage}
                      onClick={handleEditImage}
                      className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {editingImage ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Reimagining...
                        </>
                      ) : (
                        <>
                          Generate Mockup
                          <TrendingUp className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#141414] p-4 flex flex-col shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Preview</span>
                    {mockupImage && <button onClick={() => setMockupImage(null)} className="text-[10px] uppercase font-bold hover:underline">Reset</button>}
                  </div>
                  <div className="flex-1 bg-[#F5F5F5] border border-[#141414]/10 rounded overflow-hidden flex items-center justify-center min-h-[400px]">
                    {mockupImage ? (
                      <img src={mockupImage} alt="Mockup Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center space-y-2 opacity-20">
                        <ImageIcon className="w-12 h-12 mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-widest">No image uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold">BOND © 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold opacity-50">
            <a href="#" className="hover:opacity-100">Terms</a>
            <a href="#" className="hover:opacity-100">Privacy</a>
            <a href="#" className="hover:opacity-100">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
