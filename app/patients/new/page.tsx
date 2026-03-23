"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";
import type { ApiResponse } from "@/lib/api-response";

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  phoneCountryCode: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "female",
  phoneCountryCode: DEFAULT_COUNTRY_CODE,
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: ""
};

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const maxDob = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setGlobalError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as ApiResponse<{ id: string; warnings?: string[] }>;
      if (!response.ok) {
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          setFieldErrors(payload.fieldErrors as Record<string, string>);
        }
        setGlobalError(payload?.message ?? "Could not save patient.");
        return;
      }

      setForm(initialState);
      setSuccess("Patient created successfully.");
      const warning = Array.isArray(payload?.warnings) && payload.warnings.length > 0 ? payload.warnings.join(" ") : "";
      router.push(`/patients?created=${payload.id}${warning ? `&warning=${encodeURIComponent(warning)}` : ""}`);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack-lg">
      <div className="panel panel-hero">
        <p className="hero-kicker">Patient Intake</p>
        <h1 className="section-title">Add New Patient</h1>
        <p className="hint">Capture complete demographics in one place. Fields marked with * are required.</p>
        <div className="pill-row">
          <span className="pill">Fast Entry</span>
          <span className="pill">Country-Aware Phone</span>
          <span className="pill">Validation Built-In</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2 className="section-title">Core Demographics</h2>
          <span className="section-chip">Required</span>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="field-grid">
          <label>
            <span className="required">First Name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              autoComplete="given-name"
              required
            />
            {fieldErrors.firstName ? <span className="field-error">{fieldErrors.firstName}</span> : null}
          </label>

          <label>
            <span className="required">Last Name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              autoComplete="family-name"
              required
            />
            {fieldErrors.lastName ? <span className="field-error">{fieldErrors.lastName}</span> : null}
          </label>

          <label>
            <span className="required">Date of Birth</span>
            <input
              type="date"
              value={form.dob}
              max={maxDob}
              onChange={(e) => onChange("dob", e.target.value)}
              required
            />
            {fieldErrors.dob ? <span className="field-error">{fieldErrors.dob}</span> : null}
          </label>

          <label>
            <span className="required">Gender</span>
            <select value={form.gender} onChange={(e) => onChange("gender", e.target.value as FormState["gender"])}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {fieldErrors.gender ? <span className="field-error">{fieldErrors.gender}</span> : null}
          </label>

          <div className="full section-divider">Contact</div>

          <label>
            <span>Phone</span>
            <div className="phone-input-group">
              <select
                aria-label="Phone country code"
                value={form.phoneCountryCode}
                onChange={(e) => onChange("phoneCountryCode", e.target.value)}
              >
                {COUNTRY_CODES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                autoComplete="tel-national"
                placeholder="Local number"
              />
            </div>
            {fieldErrors.phoneCountryCode ? <span className="field-error">{fieldErrors.phoneCountryCode}</span> : null}
            {fieldErrors.phone ? <span className="field-error">{fieldErrors.phone}</span> : null}
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              autoComplete="email"
            />
          </label>

          <div className="full section-divider">Address</div>

          <label className="full">
            <span>Address Line 1</span>
            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) => onChange("addressLine1", e.target.value)}
              autoComplete="address-line1"
            />
          </label>

          <label className="full">
            <span>Address Line 2</span>
            <input
              type="text"
              value={form.addressLine2}
              onChange={(e) => onChange("addressLine2", e.target.value)}
              autoComplete="address-line2"
            />
          </label>

          <label>
            <span>City</span>
            <input type="text" value={form.city} onChange={(e) => onChange("city", e.target.value)} autoComplete="address-level2" />
          </label>

          <label>
            <span>State</span>
            <input type="text" value={form.state} onChange={(e) => onChange("state", e.target.value)} autoComplete="address-level1" />
          </label>

          <label>
            <span>Postal Code</span>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => onChange("postalCode", e.target.value)}
              autoComplete="postal-code"
            />
          </label>

          <div className="full section-divider">Additional Notes</div>

          <label className="full">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
          </label>
          </div>

          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save Patient"}
            </button>
          </div>
        </form>
      </section>

      {globalError ? <div className="msg error">{globalError}</div> : null}
      {success ? <div className="msg success">{success}</div> : null}
    </section>
  );
}
