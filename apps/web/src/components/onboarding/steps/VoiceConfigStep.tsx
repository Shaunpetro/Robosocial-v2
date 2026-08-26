// apps/web/src/components/onboarding/steps/VoiceConfigStep.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Sparkles,
  Volume2,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface VoiceConfigStepProps {
  initialVoice?: {
    formality: string
    personality: string[]
    technicalLevel: string
  }
  onUpdate: (voice: {
    formality: string
    personality: string[]
    technicalLevel: string
  }) => void
  companyName: string
  industry?: string | null
}

// ============================================
// OPTIONS
// ============================================

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', emoji: 'ðŸ˜Š', description: 'Friendly and relaxed' },
  { value: 'friendly', label: 'Friendly', emoji: 'ðŸ‘‹', description: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', emoji: 'ðŸ’¼', description: 'Business-like but personable' },
  { value: 'corporate', label: 'Corporate', emoji: 'ðŸ¢', description: 'Formal and authoritative' },
  { value: 'formal', label: 'Formal', emoji: 'ðŸ“‹', description: 'Traditional and serious' },
]

const PERSONALITY_TRAITS = [
  { value: 'confident', label: 'Confident', description: 'Self-assured and decisive' },
  { value: 'humble', label: 'Humble', description: 'Modest and grounded' },
  { value: 'expert', label: 'Expert', description: 'Knowledgeable and authoritative' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and welcoming' },
  { value: 'bold', label: 'Bold', description: 'Daring and impactful' },
  { value: 'reliable', label: 'Reliable', description: 'Trustworthy and dependable' },
  { value: 'innovative', label: 'Innovative', description: 'Creative and forward-thinking' },
  { value: 'traditional', label: 'Traditional', description: 'Classic and established' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic and enthusiastic' },
  { value: 'calm', label: 'Calm', description: 'Composed and measured' },
  { value: 'authentic', label: 'Authentic', description: 'Genuine and real' },
  { value: 'playful', label: 'Playful', description: 'Fun and light-hearted' },
]

const TECHNICAL_LEVELS = [
  { value: 'low', label: 'Simple', description: 'Easy to understand, no jargon' },
  { value: 'medium', label: 'Balanced', description: 'Some industry terms, mostly accessible' },
  { value: 'high', label: 'Technical', description: 'Industry terminology, expert audience' },
]

// ============================================
// COMPONENT
// ============================================

export default function VoiceConfigStep({
  initialVoice,
  onUpdate,
  companyName,
  industry,
}: VoiceConfigStepProps) {
  // Ensure values are always strings
  const safeFormality: string = FORMALITY_OPTIONS.some(o => o.value === initialVoice?.formality)
    ? (initialVoice?.formality as string)
    : 'professional'

  const safeTechnicalLevel: string = ['low', 'medium', 'high'].includes(initialVoice?.technicalLevel || '')
    ? (initialVoice?.technicalLevel as string)
    : 'medium'

  const [formality, setFormality] = useState<string>(safeFormality)
  const [personality, setPersonality] = useState<string[]>(
    Array.isArray(initialVoice?.personality) ? initialVoice.personality : []
  )
  const [technicalLevel, setTechnicalLevel] = useState<string>(safeTechnicalLevel)

  // AI preview state
  const [aiPreview, setAiPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Generate AI preview when settings change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      await generatePreview()
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formality, personality, technicalLevel])

  const generatePreview = async () => {
    setIsGenerating(true)
    setPreviewError(null)

    try {
      const res = await fetch('/api/generate/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry: industry || '',
          formality,
          personality,
          technicalLevel,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiPreview(data.preview)
      } else {
        const err = await res.json()
        setPreviewError(err.error || 'Failed to generate preview')
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
      setPreviewError('Failed to generate preview')
    } finally {
      setIsGenerating(false)
    }
  }

  // Toggle personality trait
  const toggleTrait = (trait: string) => {
    let updated: string[]

    if (personality.includes(trait)) {
      updated = personality.filter(t => t !== trait)
    } else if (personality.length < 3) {
      updated = [...personality, trait]
    } else {
      updated = [...personality.slice(1), trait]
    }

    setPersonality(updated)
    onUpdate({ formality, personality: updated, technicalLevel })
  }

  const updateFormality = (value: string) => {
    setFormality(value)
    onUpdate({ formality: value, personality, technicalLevel })
  }

  const updateTechnicalLevel = (value: string) => {
    setTechnicalLevel(value)
    onUpdate({ formality, personality, technicalLevel: value })
  }

  const formalityIndex = FORMALITY_OPTIONS.findIndex(f => f.value === formality)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <MessageSquare size={32} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          How should {companyName} sound?
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Define your brand voice for consistent, authentic content
        </p>
      </div>

      {/* AI Detected Notice */}
      {initialVoice && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Sparkles size={18} className="text-purple-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              AI-Detected Voice
            </p>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
              We analyzed your content and detected your current voice. Adjust as needed.
            </p>
          </div>
        </div>
      )}

      {/* Formality Slider */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Formality Level
        </label>

        <div className="px-2">
          <input
            type="range"
            min="0"
            max={FORMALITY_OPTIONS.length - 1}
            value={formalityIndex >= 0 ? formalityIndex : 0}
            onChange={(e) => updateFormality(FORMALITY_OPTIONS[parseInt(e.target.value)].value)}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-brand-500"
          />

          <div className="flex justify-between mt-2">
            {FORMALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormality(option.value)}
                className={`flex flex-col items-center gap-1 transition-opacity ${
                  formality === option.value ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-center text-[var(--text-secondary)]">
          {FORMALITY_OPTIONS.find(f => f.value === formality)?.description || 'Professional'}
        </p>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Personality Traits
          </label>
          <span className="text-xs text-[var(--text-tertiary)]">
            Select up to 3
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {PERSONALITY_TRAITS.map((trait) => {
            const isSelected = personality.includes(trait.value)
            return (
              <button
                key={trait.value}
                type="button"
                onClick={() => toggleTrait(trait.value)}
                className={`p-2 rounded-lg border-2 transition-all text-center ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-primary)]'
                }`}>
                  {trait.label}
                </span>
              </button>
            )
          })}
        </div>

        {personality.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {personality.map(trait => {
              const traitData = PERSONALITY_TRAITS.find(t => t.value === trait)
              return (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-full text-sm bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  {traitData?.label || trait}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Technical Level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--text-primary)]">
          Technical Level
        </label>

        <div className="grid grid-cols-3 gap-2">
          {TECHNICAL_LEVELS.map((level) => {
            const isSelected = technicalLevel === level.value
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => updateTechnicalLevel(level.value)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
                }`}
              >
                <p className={`font-semibold ${
                  isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-[var(--text-primary)]'
                }`}>
                  {level.label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {level.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[var(--text-tertiary)]" />
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Live Preview
          </label>
          {isGenerating && <Loader2 size={14} className="animate-spin text-brand-500" />}
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          {isGenerating ? (
            <p className="text-sm text-[var(--text-tertiary)] italic">Generating previewâ€¦</p>
          ) : aiPreview ? (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{aiPreview}</p>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">Adjust settings to see a sample post.</p>
          )}
        </div>

        {previewError && (
          <p className="text-xs text-red-500">{previewError}</p>
        )}

        <button
          onClick={generatePreview}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          Regenerate Preview
        </button>

        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
          <Info size={12} />
          This is an AI-generated example based on your voice settings.
        </p>
      </div>
    </div>
  )
}