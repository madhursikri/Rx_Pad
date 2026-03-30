"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/lib/api-response";
import type { MedicationOption } from "@/types/patient";

type MedicationFormState = {
  name: string;
  commonStrengths: string;
  defaultDose: string;
  defaultFrequency: string;
  defaultDuration: string;
  defaultInstructions: string;
};

const initialForm: MedicationFormState = {
  name: "",
  commonStrengths: "",
  defaultDose: "1 tablet",
  defaultFrequency: "Twice daily",
  defaultDuration: "7 days",
  defaultInstructions: ""
};

export default function PrescriptionDatasetPage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<MedicationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<MedicationFormState>(initialForm);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const visibleCount = useMemo(() => entries.length, [entries.length]);
  const isEditing = editingEntryId !== null;

  async function loadDataset(searchValue: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/medications?query=${encodeURIComponent(searchValue.trim())}`);
      const payload = (await response.json()) as MedicationOption[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Could not load prescription dataset.");
        return;
      }
      setEntries(payload as MedicationOption[]);
    } catch {
      setError("Could not load prescription dataset.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadDataset(query);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function onFormChange<K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSelectEntry(entry: MedicationOption) {
    setEditingEntryId(entry.id);
    setForm({
      name: entry.name,
      commonStrengths: entry.commonStrengths ?? "",
      defaultDose: entry.defaultDose ?? "",
      defaultFrequency: entry.defaultFrequency ?? "",
      defaultDuration: entry.defaultDuration ?? "",
      defaultInstructions: entry.defaultInstructions ?? ""
    });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  }

  function onResetForm() {
    setEditingEntryId(null);
    setForm(initialForm);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      const response = await fetch(isEditing ? `/api/medications/${editingEntryId}` : "/api/medications", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as ApiResponse<MedicationOption>;
      if (!response.ok) {
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          setFieldErrors(payload.fieldErrors as Record<string, string>);
        }
        setError(payload?.message ?? "Could not add prescription dataset entry.");
        return;
      }

      onResetForm();
      setSuccess(isEditing ? "Prescription dataset entry updated." : "Prescription dataset entry added.");
      await loadDataset(query);
    } catch {
      setError(isEditing ? "Network error while updating dataset entry." : "Network error while creating dataset entry.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteEntry() {
    if (!editingEntryId) return;
    const confirmed = window.confirm("Delete this prescription dataset entry?");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/medications/${editingEntryId}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as ApiResponse<{ success?: boolean }>;
      if (!response.ok) {
        setError(payload?.message ?? "Could not delete prescription dataset entry.");
        return;
      }

      onResetForm();
      setSuccess("Prescription dataset entry deleted.");
      await loadDataset(query);
    } catch {
      setError("Network error while deleting dataset entry.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="stack-lg">
      <div className="panel panel-hero">
        <p className="hero-kicker">Prescription Dataset</p>
        <h1 className="section-title">Frequently Used Prescriptions</h1>
        <p className="hint">Manage reusable medication entries and default dosage instructions for faster prescribing.</p>
      </div>

      <section className="search-layout">
        <div className="panel">
          <div className="panel-header">
            <h2 className="section-title">Dataset Entries</h2>
            <span className="section-chip">{loading ? "Loading..." : `${visibleCount} visible`}</span>
          </div>
          <label>
            <span>Search by medication name</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type medication name"
            />
          </label>

          {error ? <div className="msg error">{error}</div> : null}
          {success ? <div className="msg success">{success}</div> : null}

          <ul className="rx-list">
            {loading ? <li className="hint">Loading dataset...</li> : null}
            {!loading && entries.length === 0 ? <li className="hint">No entries found.</li> : null}
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`rx-card rx-card-selectable ${editingEntryId === entry.id ? "rx-card-selected" : ""}`}
                  onClick={() => onSelectEntry(entry)}
                >
                  <p className="rx-title">{entry.name}</p>
                  <p className="rx-meta">Strengths: {entry.commonStrengths ?? "Not specified"}</p>
                  <p className="rx-meta">
                    Default: {entry.defaultDose ?? "N/A"} | {entry.defaultFrequency ?? "N/A"} | {entry.defaultDuration ?? "N/A"}
                  </p>
                  {entry.defaultInstructions ? <p className="rx-note">Instructions: {entry.defaultInstructions}</p> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2 className="section-title">{isEditing ? "Edit Dataset Entry" : "Add Dataset Entry"}</h2>
            <span className="section-chip">{isEditing ? "Editing" : "New"}</span>
          </div>

          <form className="rx-form-grid" onSubmit={onSubmit} noValidate>
            <label className="full">
              <span className="required">Medication Name</span>
              <input type="text" value={form.name} onChange={(e) => onFormChange("name", e.target.value)} placeholder="Amoxicillin" />
              {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
            </label>

            <label className="full">
              <span>Common Strengths</span>
              <input
                type="text"
                value={form.commonStrengths}
                onChange={(e) => onFormChange("commonStrengths", e.target.value)}
                placeholder="250 mg, 500 mg"
              />
            </label>

            <label>
              <span className="required">Default Dose</span>
              <input type="text" value={form.defaultDose} onChange={(e) => onFormChange("defaultDose", e.target.value)} placeholder="1 tablet" />
              {fieldErrors.defaultDose ? <span className="field-error">{fieldErrors.defaultDose}</span> : null}
            </label>

            <label>
              <span className="required">Default Frequency</span>
              <input
                type="text"
                value={form.defaultFrequency}
                onChange={(e) => onFormChange("defaultFrequency", e.target.value)}
                placeholder="Twice daily"
              />
              {fieldErrors.defaultFrequency ? <span className="field-error">{fieldErrors.defaultFrequency}</span> : null}
            </label>

            <label>
              <span className="required">Default Duration</span>
              <input
                type="text"
                value={form.defaultDuration}
                onChange={(e) => onFormChange("defaultDuration", e.target.value)}
                placeholder="7 days"
              />
              {fieldErrors.defaultDuration ? <span className="field-error">{fieldErrors.defaultDuration}</span> : null}
            </label>

            <label className="full">
              <span>Default Instructions</span>
              <textarea
                value={form.defaultInstructions}
                onChange={(e) => onFormChange("defaultInstructions", e.target.value)}
                placeholder="Take after food"
              />
            </label>

            <div className="actions full">
              {isEditing ? (
                <>
                  <button type="button" className="btn btn-soft" onClick={onResetForm} disabled={saving || deleting}>
                    Cancel Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={onDeleteEntry} disabled={saving || deleting}>
                    {deleting ? "Deleting..." : "Delete Entry"}
                  </button>
                </>
              ) : null}
              <button type="submit" className="btn" disabled={saving || deleting}>
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Prescription Entry"}
              </button>
            </div>
          </form>
        </aside>
      </section>
    </section>
  );
}
