/**
 * MerchantAssessmentPage — create and edit merchant trust assessments.
 *
 * Route params:
 *   id = 'new'  → create mode
 *   id = <uuid> → edit mode (loads existing data)
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { PillarRating, MerchantStatus, Verdict } from '@rateit/shared-types';
import { computeVerdict } from '@rateit/verdict-engine';
import { MOCK_MERCHANTS } from '../data/merchants';
import { MOCK_ASSESSMENTS } from '../data/assessments';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  // Merchant fields
  name: string;
  domain: string;
  category: string;
  status: MerchantStatus;
  lastReviewedAt: string; // ISO date string (YYYY-MM-DD for <input type="date">)

  // Assessment fields
  transparencyRating: PillarRating;
  reliabilityRating: PillarRating;
  integrityRating: PillarRating;
  communicationRating: PillarRating;
  redFlags: string[];
  internalRationale: string;
  publicSummary: string;
  publicReasons: string[]; // 3–4 items
}

type FormErrors = Partial<Record<keyof FormState | 'publicReasons_0' | 'publicReasons_1' | 'publicReasons_2', string>>;

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_FORM: FormState = {
  name: '',
  domain: '',
  category: '',
  status: 'active',
  lastReviewedAt: new Date().toISOString().substring(0, 10),
  transparencyRating: 'Unknown',
  reliabilityRating: 'Unknown',
  integrityRating: 'Unknown',
  communicationRating: 'Unknown',
  redFlags: [''],
  internalRationale: '',
  publicSummary: '',
  publicReasons: ['', '', ''],
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function FieldLabel({
  label,
  required,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="form-label">
      {label}
      {required && <span className="required-star"> *</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="form-field">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input${error ? ' form-input-error' : ''}`}
      />
      <FieldError message={error} />
    </div>
  );
}

function SelectInput<T extends string>({
  id,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  error?: string;
}) {
  return (
    <div className="form-field">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`form-input${error ? ' form-input-error' : ''}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

function TextareaInput({
  id,
  value,
  onChange,
  rows,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="form-field">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows ?? 4}
        placeholder={placeholder}
        className={`form-input form-textarea${error ? ' form-input-error' : ''}`}
      />
      <FieldError message={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pillar options
// ---------------------------------------------------------------------------

const PILLAR_OPTIONS: { value: PillarRating; label: string }[] = [
  { value: 'Unknown', label: 'Unknown — no data' },
  { value: 'Strong',  label: 'Strong — reliable evidence' },
  { value: 'Mixed',   label: 'Mixed — inconsistent signals' },
  { value: 'Weak',    label: 'Weak — poor or negative evidence' },
];

const STATUS_OPTIONS: { value: MerchantStatus; label: string }[] = [
  { value: 'active',       label: 'Active' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'suspended',    label: 'Suspended' },
];

// ---------------------------------------------------------------------------
// Verdict display
// ---------------------------------------------------------------------------

const VERDICT_STYLE: Record<Verdict, { cls: string; description: string }> = {
  Trusted: {
    cls: 'verdict-trusted',
    description: '3+ strong pillars and no red flags',
  },
  Caution: {
    cls: 'verdict-caution',
    description: 'Mixed profile — some concerns identified',
  },
  'High Risk': {
    cls: 'verdict-high-risk',
    description: '2+ weak pillars or 2+ red flags',
  },
  'Insufficient Data': {
    cls: 'verdict-insufficient',
    description: 'All pillars unknown and no red flags',
  },
};

function VerdictDisplay({ verdict }: { verdict: Verdict }) {
  const style = VERDICT_STYLE[verdict];
  return (
    <div className={`verdict-banner ${style.cls}`}>
      <span className="verdict-label">Current Verdict</span>
      <span className="verdict-value">{verdict}</span>
      <span className="verdict-desc">{style.description}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Store name is required';
  if (!form.domain.trim()) errors.domain = 'Domain is required';
  if (!form.category.trim()) errors.category = 'Category is required';
  if (!form.lastReviewedAt) errors.lastReviewedAt = 'Last reviewed date is required';
  if (!form.internalRationale.trim()) errors.internalRationale = 'Internal rationale is required';
  if (!form.publicSummary.trim()) errors.publicSummary = 'Public summary is required';

  if (!form.publicReasons[0]?.trim()) errors['publicReasons_0'] = 'At least one public reason is required';
  if (!form.publicReasons[1]?.trim()) errors['publicReasons_1'] = 'At least two public reasons are required';
  if (!form.publicReasons[2]?.trim()) errors['publicReasons_2'] = 'At least three public reasons are required';

  return errors;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

interface MerchantApiResponse {
  id: string;
  name: string;
  domain: string;
  category: string;
  currentVerdict: Verdict;
  lastReviewedAt: string | null;
  publicSummary: string;
  status: MerchantStatus;
  assessment: {
    transparencyRating: PillarRating;
    reliabilityRating: PillarRating;
    integrityRating: PillarRating;
    communicationRating: PillarRating;
    redFlags: string[];
    internalRationale: string;
    publicSummary: string;
    publicReasons: string[];
  } | null;
}

async function fetchMerchant(id: string): Promise<MerchantApiResponse | null> {
  try {
    const res = await fetch(`/api/merchants/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as MerchantApiResponse;
  } catch {
    return null;
  }
}

async function saveMerchant(
  id: string | null,
  payload: object,
): Promise<MerchantApiResponse | null> {
  try {
    const url = id ? `/api/merchants/${id}` : '/api/merchants';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as MerchantApiResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function MerchantAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  // ── Computed live verdict ──────────────────────────────────────────────────
  const verdict: Verdict = computeVerdict({
    transparencyRating: form.transparencyRating,
    reliabilityRating: form.reliabilityRating,
    integrityRating: form.integrityRating,
    communicationRating: form.communicationRating,
    redFlags: form.redFlags.filter((f) => f.trim() !== ''),
  });

  // ── Load existing data in edit mode ───────────────────────────────────────
  const loadMerchant = useCallback(async () => {
    if (isNew || !id) return;

    // 1. Try real API
    const data = await fetchMerchant(id);
    if (data) {
      setForm({
        name: data.name,
        domain: data.domain,
        category: data.category,
        status: data.status,
        lastReviewedAt: data.lastReviewedAt
          ? data.lastReviewedAt.substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        transparencyRating: data.assessment?.transparencyRating ?? 'Unknown',
        reliabilityRating: data.assessment?.reliabilityRating ?? 'Unknown',
        integrityRating: data.assessment?.integrityRating ?? 'Unknown',
        communicationRating: data.assessment?.communicationRating ?? 'Unknown',
        redFlags: data.assessment?.redFlags.length
          ? data.assessment.redFlags
          : [''],
        internalRationale: data.assessment?.internalRationale ?? '',
        publicSummary: data.assessment?.publicSummary ?? data.publicSummary,
        publicReasons: padToThree(data.assessment?.publicReasons ?? []),
      });
      setLoading(false);
      return;
    }

    // 2. Fall back to mock data
    const mockMerchant = MOCK_MERCHANTS.find((m) => m.id === id);
    const mockAssessment = MOCK_ASSESSMENTS.find((a) => a.merchantId === id);
    if (mockMerchant) {
      setForm({
        name: mockMerchant.name,
        domain: mockMerchant.domain,
        category: mockMerchant.category,
        status: mockMerchant.status,
        lastReviewedAt: mockMerchant.lastReviewedAt.substring(0, 10),
        transparencyRating: mockAssessment?.transparencyRating ?? 'Unknown',
        reliabilityRating: mockAssessment?.reliabilityRating ?? 'Unknown',
        integrityRating: mockAssessment?.integrityRating ?? 'Unknown',
        communicationRating: mockAssessment?.communicationRating ?? 'Unknown',
        redFlags: mockAssessment?.redFlags.length ? mockAssessment.redFlags : [''],
        internalRationale: mockAssessment?.internalRationale ?? '',
        publicSummary: mockAssessment?.publicSummary ?? mockMerchant.publicSummary,
        publicReasons: padToThree(mockAssessment?.publicReasons ?? []),
      });
    }
    setLoading(false);
  }, [id, isNew]);

  useEffect(() => {
    loadMerchant();
  }, [loadMerchant]);

  // ── Field setters ──────────────────────────────────────────────────────────

  /** Remove a validation error for the given key if it exists. */
  function clearError(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key as keyof FormErrors);
  }

  // ── Red flags list ─────────────────────────────────────────────────────────
  function setRedFlag(index: number, value: string) {
    const updated = [...form.redFlags];
    updated[index] = value;
    setForm((prev) => ({ ...prev, redFlags: updated }));
  }

  function addRedFlag() {
    setForm((prev) => ({ ...prev, redFlags: [...prev.redFlags, ''] }));
  }

  function removeRedFlag(index: number) {
    const updated = form.redFlags.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, redFlags: updated.length ? updated : [''] }));
  }

  // ── Public reasons list ────────────────────────────────────────────────────
  function setPublicReason(index: number, value: string) {
    const updated = [...form.publicReasons];
    updated[index] = value;
    setForm((prev) => ({ ...prev, publicReasons: updated }));
    if (value.trim()) {
      clearError(`publicReasons_${index}` as keyof FormErrors);
    }
  }

  function addPublicReason() {
    if (form.publicReasons.length >= 4) return;
    setForm((prev) => ({ ...prev, publicReasons: [...prev.publicReasons, ''] }));
  }

  function removePublicReason(index: number) {
    if (form.publicReasons.length <= 3) return;
    const updated = form.publicReasons.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, publicReasons: updated }));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload = {
      name: form.name.trim(),
      domain: form.domain.trim(),
      category: form.category.trim(),
      status: form.status,
      lastReviewedAt: form.lastReviewedAt,
      assessment: {
        transparencyRating: form.transparencyRating,
        reliabilityRating: form.reliabilityRating,
        integrityRating: form.integrityRating,
        communicationRating: form.communicationRating,
        redFlags: form.redFlags.filter((f) => f.trim() !== ''),
        internalRationale: form.internalRationale.trim(),
        publicSummary: form.publicSummary.trim(),
        publicReasons: form.publicReasons.filter((r) => r.trim() !== ''),
      },
    };

    const result = await saveMerchant(isNew ? null : id!, payload);

    setSaving(false);

    if (!result) {
      setSaveError(
        'Could not reach the API server. Ensure the API is running on port 3001 (npm run dev in apps/api).',
      );
      return;
    }

    navigate('/merchants');
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Link to="/merchants" className="back-link">← Back to Merchants</Link>
        <p style={{ color: '#666', marginTop: 8 }}>Loading…</p>
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const title = isNew ? 'Create Merchant Assessment' : `Edit: ${form.name}`;

  return (
    <>
      <Link to="/merchants" className="back-link">← Back to Merchants</Link>

      <div className="assessment-layout">
        {/* ── Verdict sidebar ─────────────────────────────── */}
        <aside className="verdict-sidebar">
          <VerdictDisplay verdict={verdict} />
          <div className="verdict-hint">
            <p>Verdict recalculates live as you edit the pillar ratings and red flags.</p>
            <ul className="verdict-rules">
              <li><strong>Trusted</strong> — 3+ Strong, 0 red flags</li>
              <li><strong>High Risk</strong> — 2+ Weak OR 2+ red flags</li>
              <li><strong>Caution</strong> — mixed profile</li>
              <li><strong>Insufficient Data</strong> — all Unknown, no red flags</li>
            </ul>
          </div>
        </aside>

        {/* ── Main form ───────────────────────────────────── */}
        <div className="assessment-form-card">
          <h2>{title}</h2>

          {saveError && (
            <div className="save-error" role="alert">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Section: Merchant ── */}
            <section className="form-section">
              <h3 className="section-heading">Merchant Details</h3>

              <div className="form-row">
                <div className="form-col">
                  <FieldLabel label="Store Name" required htmlFor="name" />
                  <TextInput
                    id="name"
                    value={form.name}
                    onChange={(v) => setField('name', v)}
                    placeholder="e.g. ShopTrusted"
                    required
                    error={errors.name}
                  />
                </div>
                <div className="form-col">
                  <FieldLabel label="Domain" required htmlFor="domain" />
                  <TextInput
                    id="domain"
                    value={form.domain}
                    onChange={(v) => setField('domain', v)}
                    placeholder="e.g. shoptrusted.com.au"
                    required
                    error={errors.domain}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <FieldLabel label="Category" required htmlFor="category" />
                  <TextInput
                    id="category"
                    value={form.category}
                    onChange={(v) => setField('category', v)}
                    placeholder="e.g. General Retail"
                    required
                    error={errors.category}
                  />
                </div>
                <div className="form-col">
                  <FieldLabel label="Status" htmlFor="status" />
                  <SelectInput
                    id="status"
                    value={form.status}
                    onChange={(v) => setField('status', v)}
                    options={STATUS_OPTIONS}
                  />
                </div>
              </div>

              <div className="form-row form-row-half">
                <div className="form-col">
                  <FieldLabel label="Last Reviewed Date" required htmlFor="lastReviewedAt" />
                  <div className="form-field">
                    <input
                      id="lastReviewedAt"
                      type="date"
                      value={form.lastReviewedAt}
                      onChange={(e) => setField('lastReviewedAt', e.target.value)}
                      required
                      className={`form-input${errors.lastReviewedAt ? ' form-input-error' : ''}`}
                    />
                    <FieldError message={errors.lastReviewedAt} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section: Trust Pillars ── */}
            <section className="form-section">
              <h3 className="section-heading">Trust Pillars</h3>

              <div className="form-row">
                <div className="form-col">
                  <FieldLabel label="Transparency" htmlFor="transparencyRating" />
                  <SelectInput
                    id="transparencyRating"
                    value={form.transparencyRating}
                    onChange={(v) => setField('transparencyRating', v)}
                    options={PILLAR_OPTIONS}
                  />
                </div>
                <div className="form-col">
                  <FieldLabel label="Reliability" htmlFor="reliabilityRating" />
                  <SelectInput
                    id="reliabilityRating"
                    value={form.reliabilityRating}
                    onChange={(v) => setField('reliabilityRating', v)}
                    options={PILLAR_OPTIONS}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <FieldLabel label="Integrity" htmlFor="integrityRating" />
                  <SelectInput
                    id="integrityRating"
                    value={form.integrityRating}
                    onChange={(v) => setField('integrityRating', v)}
                    options={PILLAR_OPTIONS}
                  />
                </div>
                <div className="form-col">
                  <FieldLabel label="Communication" htmlFor="communicationRating" />
                  <SelectInput
                    id="communicationRating"
                    value={form.communicationRating}
                    onChange={(v) => setField('communicationRating', v)}
                    options={PILLAR_OPTIONS}
                  />
                </div>
              </div>
            </section>

            {/* ── Section: Red Flags ── */}
            <section className="form-section">
              <h3 className="section-heading">Red Flags</h3>
              <p className="section-hint">Add specific behaviours or concerns observed (optional but impactful on verdict).</p>

              <div className="list-input-group">
                {form.redFlags.map((flag, i) => (
                  <div key={i} className="list-input-row">
                    <input
                      type="text"
                      value={flag}
                      onChange={(e) => setRedFlag(i, e.target.value)}
                      placeholder={`Red flag ${i + 1} (e.g. Misleading product descriptions)`}
                      className="form-input"
                    />
                    {form.redFlags.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeRedFlag(i)}
                        aria-label={`Remove red flag ${i + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-item" onClick={addRedFlag}>
                  + Add red flag
                </button>
              </div>
            </section>

            {/* ── Section: Rationale & Summaries ── */}
            <section className="form-section">
              <h3 className="section-heading">Rationale &amp; Summaries</h3>

              <div className="form-field-block">
                <FieldLabel label="Internal Rationale" required htmlFor="internalRationale" />
                <TextareaInput
                  id="internalRationale"
                  value={form.internalRationale}
                  onChange={(v) => setField('internalRationale', v)}
                  rows={4}
                  placeholder="Reviewer notes — internal only. Explain the evidence basis for each pillar rating."
                  error={errors.internalRationale}
                />
              </div>

              <div className="form-field-block">
                <FieldLabel label="Public Summary" required htmlFor="publicSummary" />
                <TextareaInput
                  id="publicSummary"
                  value={form.publicSummary}
                  onChange={(v) => setField('publicSummary', v)}
                  rows={3}
                  placeholder="Brief shopper-facing summary of this merchant's trust profile."
                  error={errors.publicSummary}
                />
              </div>
            </section>

            {/* ── Section: Top Public Reasons ── */}
            <section className="form-section">
              <h3 className="section-heading">Top Public Reasons</h3>
              <p className="section-hint">3 to 4 short, shopper-facing reasons shown in the extension.</p>

              <div className="list-input-group">
                {form.publicReasons.map((reason, i) => (
                  <div key={i} className="list-input-row">
                    <div className="list-input-with-error" style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setPublicReason(i, e.target.value)}
                        placeholder={`Reason ${i + 1}`}
                        className={`form-input${errors[`publicReasons_${i}` as keyof FormErrors] ? ' form-input-error' : ''}`}
                        required={i < 3}
                      />
                      <FieldError message={errors[`publicReasons_${i}` as keyof FormErrors]} />
                    </div>
                    {form.publicReasons.length > 3 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removePublicReason(i)}
                        aria-label={`Remove reason ${i + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {form.publicReasons.length < 4 && (
                  <button type="button" className="btn-add-item" onClick={addPublicReason}>
                    + Add reason (optional 4th)
                  </button>
                )}
              </div>
            </section>

            {/* ── Actions ── */}
            <div className="detail-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : isNew ? 'Create Assessment' : 'Save Changes'}
              </button>
              <Link to="/merchants" className="btn btn-secondary">
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Ensure a reasons array has at least 3 elements. */
function padToThree(arr: string[]): string[] {
  const copy = [...arr];
  while (copy.length < 3) copy.push('');
  return copy;
}

export default MerchantAssessmentPage;
