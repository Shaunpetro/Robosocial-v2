// apps/web/src/components/onboarding/steps/ConfirmAnalysisStep.tsx

'use client'

import { useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import {
  Building2,
  Briefcase,
  Trophy,
  Users,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Edit3,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import type { CompanyAnalysis, ExtractedIndustry, ExtractedService, ExtractedUSP } from '@/lib/intelligence/extractors'

interface ConfirmAnalysisStepProps {
  analysis: CompanyAnalysis
  onConfirm: (section: string, confirmed: boolean, edits?: any) => void
  confirmationStatus: {
    industries: boolean
    services: boolean
    usps: boolean
    audience: boolean
    voice: boolean
  }
}

interface SectionCardProps {
  id: string
  icon: ElementType
  title: string
  subtitle: string
  confirmed: boolean
  children: ReactNode
}

export default function ConfirmAnalysisStep({
  analysis,
  onConfirm,
  confirmationStatus,
}: ConfirmAnalysisStepProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('industries')
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const [editedIndustries, setEditedIndustries] = useState<ExtractedIndustry[]>(analysis.industries || [])
  const [editedServices, setEditedServices] = useState<ExtractedService[]>(analysis.services || [])
  const [editedUSPs, setEditedUSPs] = useState<ExtractedUSP[]>(analysis.uniqueSellingPoints || [])
  const [editedAudience, setEditedAudience] = useState({
    ...(analysis.targetAudience || {}),
    primarySectors: analysis.targetAudience?.primarySectors || [],
    secondarySectors: analysis.targetAudience?.secondarySectors || [],
    decisionMakers: analysis.targetAudience?.decisionMakers || [],
    geographicFocus: analysis.targetAudience?.geographicFocus || [],
    businessType: analysis.targetAudience?.businessType || 'B2B',
  })
  const [editedVoice, setEditedVoice] = useState({
    ...(analysis.brandVoice || {}),
    personality: analysis.brandVoice?.personality || [],
    formality: analysis.brandVoice?.formality || 'professional',
    technicalLevel: analysis.brandVoice?.technicalLevel || 'medium',
    warmth: analysis.brandVoice?.warmth || 'moderate',
  })

  const confirmedCount = Object.values(confirmationStatus).filter(Boolean).length
  const totalSections = Object.keys(confirmationStatus).length
  const completionPercentage = Math.round((confirmedCount / totalSections) * 100)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleConfirm = (section: string) => {
    let edits = undefined
    if (section === 'industries') edits = editedIndustries
    else if (section === 'services') edits = editedServices
    else if (section === 'usps') edits = editedUSPs
    else if (section === 'audience') edits = editedAudience
    else if (section === 'voice') edits = editedVoice

    onConfirm(section, true, edits)
    setEditingSection(null)
  }

  const handleCancel = (section: string) => {
    if (section === 'industries') setEditedIndustries(analysis.industries || [])
    else if (section === 'services') setEditedServices(analysis.services || [])
    else if (section === 'usps') setEditedUSPs(analysis.uniqueSellingPoints || [])
    else if (section === 'audience') setEditedAudience({
      ...(analysis.targetAudience || {}),
      primarySectors: analysis.targetAudience?.primarySectors || [],
      secondarySectors: analysis.targetAudience?.secondarySectors || [],
      decisionMakers: analysis.targetAudience?.decisionMakers || [],
      geographicFocus: analysis.targetAudience?.geographicFocus || [],
      businessType: analysis.targetAudience?.businessType || 'B2B',
    })
    else if (section === 'voice') setEditedVoice({
      ...(analysis.brandVoice || {}),
      personality: analysis.brandVoice?.personality || [],
      formality: analysis.brandVoice?.formality || 'professional',
      technicalLevel: analysis.brandVoice?.technicalLevel || 'medium',
      warmth: analysis.brandVoice?.warmth || 'moderate',
    })
    setEditingSection(null)
  }

  const addIndustry = () => {
    setEditedIndustries(prev => [
      ...prev,
      { name: '', category: '', confidence: 0, code: '' } as ExtractedIndustry,
    ])
  }

  const addService = () => {
    setEditedServices(prev => [
      ...prev,
      { name: '', description: '', isCore: false } as ExtractedService,
    ])
  }

  const addUSP = () => {
    setEditedUSPs(prev => [...prev, { point: '', category: 'quality' }])
  }

  const SectionCard: React.FC<SectionCardProps> = ({ id, icon: Icon, title, subtitle, confirmed, children }) => (
    <div className={`rounded-xl border-2 transition-colors ${confirmed ? 'border-green-500 bg-green-500/5' : 'border-[var(--border-default)]'}`}>
      <button type="button" onClick={() => toggleSection(id)} className="w-full p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${confirmed ? 'bg-green-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
            <Icon size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {confirmed && <CheckCircle2 size={20} className="text-green-500" />}
          {expandedSection === id ? <ChevronUp size={20} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={20} className="text-[var(--text-tertiary)]" />}
        </div>
      </button>
      {expandedSection === id && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Here's What We Learned</h2>
        <p className="text-[var(--text-secondary)] mt-2">Review and confirm each section. Edit anything that's not quite right.</p>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Sections Confirmed</span>
          <span className="text-sm font-bold text-brand-500">{confirmedCount}/{totalSections}</span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
        <div className="text-2xl font-bold text-brand-500">{Math.round(analysis.confidenceScore * 100)}%</div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Analysis Confidence</p>
          <p className="text-xs text-[var(--text-tertiary)]">Based on {analysis.dataQuality} quality data sources</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Industries */}
        <SectionCard id="industries" icon={Building2} title="Industries" subtitle={`${editedIndustries.length} detected`} confirmed={confirmationStatus.industries}>
          <div className="space-y-2">
            {editingSection === 'industries' ? (
              editedIndustries.map((industry, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <input value={industry.name} onChange={(e) => { const updated = [...editedIndustries]; updated[index].name = e.target.value; setEditedIndustries(updated) }} placeholder="Industry name" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
                  <input value={industry.category} onChange={(e) => { const updated = [...editedIndustries]; updated[index].category = e.target.value; setEditedIndustries(updated) }} placeholder="Category" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
                  <div className="flex gap-2">
                    <input value={industry.cidbCode || ''} onChange={(e) => { const updated = [...editedIndustries]; updated[index].cidbCode = e.target.value; setEditedIndustries(updated) }} placeholder="CIDB Code (optional)" className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
                    <input type="number" value={industry.cidbGrade ?? ''} onChange={(e) => { const updated = [...editedIndustries]; updated[index].cidbGrade = Number(e.target.value); setEditedIndustries(updated) }} placeholder="Grade" className="w-20 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
                  </div>
                  <button onClick={() => setEditedIndustries(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))
            ) : (
              editedIndustries.map((industry, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{industry.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-tertiary)]">{industry.category}</span>
                      {industry.cidbGrade && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">CIDB {industry.cidbCode} Level {industry.cidbGrade}</span>}
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">{Math.round(industry.confidence * 100)}% match</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'industries' ? (
              <>
                <button onClick={addIndustry} className="flex items-center gap-1 text-sm text-brand-500 hover:underline"><Plus size={16} /> Add</button>
                <div className="flex-1" />
                <button onClick={() => handleCancel('industries')} className="py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={() => handleConfirm('industries')} className="py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600">Save & Confirm</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingSection('industries')} className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Edit3 size={16} /> Edit</button>
                <button onClick={() => handleConfirm('industries')} className={`flex-1 py-2 px-4 rounded-lg transition-colors ${confirmationStatus.industries ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{confirmationStatus.industries ? '✓ Confirmed' : 'Confirm Industries'}</button>
              </>
            )}
          </div>
        </SectionCard>

        {/* Services */}
        <SectionCard id="services" icon={Briefcase} title="Services" subtitle={`${editedServices.length} detected`} confirmed={confirmationStatus.services}>
          <div className="space-y-2">
            {editingSection === 'services' ? (
              editedServices.map((service, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <input value={service.name} onChange={(e) => { const updated = [...editedServices]; updated[index].name = e.target.value; setEditedServices(updated) }} placeholder="Service name" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
                  <textarea value={service.description || ''} onChange={(e) => { const updated = [...editedServices]; updated[index].description = e.target.value; setEditedServices(updated) }} placeholder="Description" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" rows={2} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={service.isCore} onChange={(e) => { const updated = [...editedServices]; updated[index].isCore = e.target.checked; setEditedServices(updated) }} /> Core Service</label>
                  <button onClick={() => setEditedServices(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))
            ) : (
              editedServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{service.name}</p>
                    {service.description && <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{service.description}</p>}
                    {service.isCore && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">Core Service</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'services' ? (
              <>
                <button onClick={addService} className="flex items-center gap-1 text-sm text-brand-500 hover:underline"><Plus size={16} /> Add</button>
                <div className="flex-1" />
                <button onClick={() => handleCancel('services')} className="py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={() => handleConfirm('services')} className="py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600">Save & Confirm</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingSection('services')} className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Edit3 size={16} /> Edit</button>
                <button onClick={() => handleConfirm('services')} className={`flex-1 py-2 px-4 rounded-lg transition-colors ${confirmationStatus.services ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{confirmationStatus.services ? '✓ Confirmed' : 'Confirm Services'}</button>
              </>
            )}
          </div>
        </SectionCard>

        {/* USPs */}
        <SectionCard id="usps" icon={Trophy} title="What Makes You Special" subtitle={`${editedUSPs.length} unique selling points`} confirmed={confirmationStatus.usps}>
          <div className="space-y-2">
            {editingSection === 'usps' ? (
              editedUSPs.map((usp, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <textarea value={usp.point} onChange={(e) => { const updated = [...editedUSPs]; updated[index].point = e.target.value; setEditedUSPs(updated) }} placeholder="USP" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" rows={2} />
                  <select value={usp.category} onChange={(e) => { const updated = [...editedUSPs]; updated[index].category = e.target.value as ExtractedUSP['category']; setEditedUSPs(updated) }} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm">
                    <option value="quality">Quality</option>
                    <option value="price">Price</option>
                    <option value="experience">Experience</option>
                    <option value="service">Service</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                    <option value="certification">Certification</option>
                    <option value="capability">Capability</option>
                    <option value="location">Location</option>
                  </select>
                  <button onClick={() => setEditedUSPs(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))
            ) : (
              editedUSPs.map((usp, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{usp.point}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 capitalize">{usp.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'usps' ? (
              <>
                <button onClick={addUSP} className="flex items-center gap-1 text-sm text-brand-500 hover:underline"><Plus size={16} /> Add</button>
                <div className="flex-1" />
                <button onClick={() => handleCancel('usps')} className="py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={() => handleConfirm('usps')} className="py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600">Save & Confirm</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingSection('usps')} className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Edit3 size={16} /> Edit</button>
                <button onClick={() => handleConfirm('usps')} className={`flex-1 py-2 px-4 rounded-lg transition-colors ${confirmationStatus.usps ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{confirmationStatus.usps ? '✓ Confirmed' : 'Confirm USPs'}</button>
              </>
            )}
          </div>
        </SectionCard>

        {/* Audience */}
        <SectionCard id="audience" icon={Users} title="Target Audience" subtitle={`${editedAudience.businessType} • ${editedAudience.primarySectors.slice(0, 2).join(', ')}`} confirmed={confirmationStatus.audience}>
          {editingSection === 'audience' ? (
            <div className="space-y-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <input value={editedAudience.businessType} onChange={(e) => setEditedAudience(prev => ({ ...prev, businessType: e.target.value as typeof prev.businessType }))} placeholder="Business Type" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
              <textarea value={editedAudience.description} onChange={(e) => setEditedAudience(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" rows={3} />
              <div><label className="text-xs text-[var(--text-tertiary)]">Primary Sectors (comma separated)</label><input value={editedAudience.primarySectors.join(', ')} onChange={(e) => setEditedAudience(prev => ({ ...prev, primarySectors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" /></div>
              <div><label className="text-xs text-[var(--text-tertiary)]">Decision Makers (comma separated)</label><input value={editedAudience.decisionMakers.join(', ')} onChange={(e) => setEditedAudience(prev => ({ ...prev, decisionMakers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" /></div>
              <div><label className="text-xs text-[var(--text-tertiary)]">Geographic Focus (comma separated)</label><input value={editedAudience.geographicFocus.join(', ')} onChange={(e) => setEditedAudience(prev => ({ ...prev, geographicFocus: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" /></div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
              <div><p className="text-xs text-[var(--text-tertiary)]">Business Type</p><p className="font-medium text-[var(--text-primary)]">{editedAudience.businessType}</p></div>
              <div><p className="text-xs text-[var(--text-tertiary)]">Primary Sectors</p><div className="flex flex-wrap gap-1 mt-1">{editedAudience.primarySectors.map((sector, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400">{sector}</span>)}</div></div>
              <div><p className="text-xs text-[var(--text-tertiary)]">Decision Makers</p><div className="flex flex-wrap gap-1 mt-1">{editedAudience.decisionMakers.map((dm, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">{dm}</span>)}</div></div>
              {editedAudience.geographicFocus.length > 0 && <div className="flex items-start gap-2"><MapPin size={14} className="text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" /><p className="text-sm text-[var(--text-secondary)]">{editedAudience.geographicFocus.join(', ')}</p></div>}
              <div><p className="text-xs text-[var(--text-tertiary)]">Summary</p><p className="text-sm text-[var(--text-primary)] mt-1">{editedAudience.description}</p></div>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'audience' ? (
              <>
                <button onClick={() => handleCancel('audience')} className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={() => handleConfirm('audience')} className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600">Save & Confirm</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingSection('audience')} className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Edit3 size={16} /> Edit</button>
                <button onClick={() => handleConfirm('audience')} className={`flex-1 py-2 px-4 rounded-lg transition-colors ${confirmationStatus.audience ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{confirmationStatus.audience ? '✓ Confirmed' : 'Confirm Audience'}</button>
              </>
            )}
          </div>
        </SectionCard>

        {/* Voice */}
        <SectionCard id="voice" icon={MessageSquare} title="Brand Voice" subtitle={`${editedVoice.formality || 'Not set'} • ${(editedVoice.personality || []).slice(0, 2).join(', ') || 'No traits'}`} confirmed={confirmationStatus.voice}>
          {editingSection === 'voice' ? (
            <div className="space-y-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <select value={editedVoice.formality} onChange={(e) => setEditedVoice(prev => ({ ...prev, formality: e.target.value as typeof prev.formality }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="corporate">Corporate</option>
                <option value="formal">Formal</option>
              </select>
              <div><label className="text-xs text-[var(--text-tertiary)]">Personality Traits (comma separated)</label><input value={editedVoice.personality.join(', ')} onChange={(e) => setEditedVoice(prev => ({ ...prev, personality: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" /></div>
              <select value={editedVoice.technicalLevel} onChange={(e) => setEditedVoice(prev => ({ ...prev, technicalLevel: e.target.value as typeof prev.technicalLevel }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {editedVoice.traits?.industryTermsUsed && (
                <div><label className="text-xs text-[var(--text-tertiary)]">Industry Terms (comma separated)</label><input value={editedVoice.traits.industryTermsUsed.join(', ')} onChange={(e) => setEditedVoice(prev => ({ ...prev, traits: { ...prev.traits, industryTermsUsed: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" /></div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
              <div><p className="text-xs text-[var(--text-tertiary)]">Formality</p><p className="font-medium text-[var(--text-primary)] capitalize">{editedVoice.formality}</p></div>
              <div><p className="text-xs text-[var(--text-tertiary)]">Personality Traits</p><div className="flex flex-wrap gap-1 mt-1">{editedVoice.personality.map((trait, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">{trait}</span>)}</div></div>
              <div><p className="text-xs text-[var(--text-tertiary)]">Technical Level</p><p className="font-medium text-[var(--text-primary)] capitalize">{editedVoice.technicalLevel}</p></div>
              {editedVoice.traits?.industryTermsUsed && editedVoice.traits.industryTermsUsed.length > 0 && <div><p className="text-xs text-[var(--text-tertiary)]">Industry Terms Used</p><div className="flex flex-wrap gap-1 mt-1">{editedVoice.traits.industryTermsUsed.map((term, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">{term}</span>)}</div></div>}
            </div>
          )}
          <div className="flex items-center gap-2 pt-2">
            {editingSection === 'voice' ? (
              <>
                <button onClick={() => handleCancel('voice')} className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={() => handleConfirm('voice')} className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600">Save & Confirm</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingSection('voice')} className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Edit3 size={16} /> Edit</button>
                <button onClick={() => handleConfirm('voice')} className={`flex-1 py-2 px-4 rounded-lg transition-colors ${confirmationStatus.voice ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{confirmationStatus.voice ? '✓ Confirmed' : 'Confirm Voice'}</button>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {completionPercentage === 100 && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
          <p className="font-medium text-green-600 dark:text-green-400">All sections confirmed!</p>
          <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Continue to set your business goal</p>
        </div>
      )}
    </div>
  )
}