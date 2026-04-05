"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/lib/api-response";
import type { DiagnosisOption } from "@/types/patient";
import { useSessionNumber } from "@/lib/use-session-number";

type DiagnosisFormState = {
  name: string;
  description: string;
};

const initialForm: DiagnosisFormState = {
  name: "",
  description: ""
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function DiagnosisDatasetPage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DiagnosisOption[]>([]);
  const [pageSize, setPageSize] = useSessionNumber("rxpad.diagnosisDataset.pageSize", 10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<DiagnosisFormState>(initialForm);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const visibleCount = useMemo(() => entries.length, [entries.length]);
  const visibleEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, page, pageSize]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(entries.length / pageSize)), [entries.length, pageSize]);
  const pageStart = entries.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = entries.length === 0 ? 0 : Math.min(entries.length, page * pageSize);
  const isEditing = editingEntryId !== null;

  async function loadDataset(searchValue: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/diagnoses?query=${encodeURIComponent(searchValue.trim())}`);
      const payload = (await response.json()) as DiagnosisOption[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Could not load diagnosis dataset.");
        return;
      }
      setEntries(payload as DiagnosisOption[]);
    } catch {
      setError("Could not load diagnosis dataset.");
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

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, pageCount));
  }, [pageCount]);

  function onFormChange<K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSelectEntry(entry: DiagnosisOption) {
    setEditingEntryId(entry.id);
    setForm({
      name: entry.name,
      description: entry.description ?? ""
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
      const response = await fetch(isEditing ? `/api/diagnoses/${editingEntryId}` : "/api/diagnoses", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as ApiResponse<DiagnosisOption>;
      if (!response.ok) {
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          setFieldErrors(payload.fieldErrors as Record<string, string>);
        }
        setError(payload?.message ?? "Could not add diagnosis dataset entry.");
        return;
      }

      onResetForm();
      setSuccess(isEditing ? "Diagnosis dataset entry updated." : "Diagnosis dataset entry added.");
      await loadDataset(query);
    } catch {
      setError(isEditing ? "Network error while updating diagnosis entry." : "Network error while creating diagnosis entry.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteEntry() {
    if (!editingEntryId) return;
    const confirmed = window.confirm("Delete this diagnosis dataset entry?");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/diagnoses/${editingEntryId}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as ApiResponse<{ success?: boolean }>;
      if (!response.ok) {
        setError(payload?.message ?? "Could not delete diagnosis dataset entry.");
        return;
      }

      onResetForm();
      setSuccess("Diagnosis dataset entry deleted.");
      await loadDataset(query);
    } catch {
      setError("Network error while deleting diagnosis entry.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="stack-lg">
      <div className="panel panel-hero">
        <p className="hero-kicker">Diagnosis Dataset</p>
        <h1 className="section-title">Frequently Used Diagnoses</h1>
        <p className="hint">Manage reusable diagnosis entries for faster and more consistent charting.</p>
      </div>

      <section className="search-layout">
        <div className="panel">
          <div className="panel-header">
            <h2 className="section-title">Dataset Entries</h2>
            <span className="section-chip">{loading ? "Loading..." : `${visibleCount} visible`}</span>
          </div>
          <label>
            <span>Search by diagnosis name</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type diagnosis name" />
          </label>

          {error ? <div className="msg error">{error}</div> : null}
          {success ? <div className="msg success">{success}</div> : null}

          <div className="paged-list-shell">
            <ul className="rx-list">
              {loading ? <li className="hint">Loading dataset...</li> : null}
              {!loading && entries.length === 0 ? <li className="hint">No entries found.</li> : null}
              {!loading &&
                visibleEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={`rx-card rx-card-selectable ${editingEntryId === entry.id ? "rx-card-selected" : ""}`}
                      onClick={() => onSelectEntry(entry)}
                    >
                      <p className="rx-title">{entry.name}</p>
                      {entry.description ? <p className="rx-note">{entry.description}</p> : null}
                    </button>
                  </li>
                ))}
            </ul>

            <div className="pagination-toolbar">
              <div className="pagination-meta">
                {entries.length === 0 ? "No pages available." : `Showing ${pageStart}-${pageEnd} of ${entries.length}`}
              </div>
              <div className="pagination-controls">
                <label className="pagination-size">
                  <span>Page size</span>
                  <select
                    aria-label="Diagnosis dataset page size"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="pagination-nav">
                <button
                  type="button"
                  className="btn btn-soft btn-xs"
                  disabled={loading || entries.length === 0 || page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-soft btn-xs"
                  disabled={loading || entries.length === 0 || page >= pageCount}
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2 className="section-title">{isEditing ? "Edit Dataset Entry" : "Add Dataset Entry"}</h2>
            <span className="section-chip">{isEditing ? "Editing" : "New"}</span>
          </div>

          <form className="rx-form-grid" onSubmit={onSubmit} noValidate>
            <label className="full">
              <span className="required">Diagnosis Name</span>
              <input type="text" value={form.name} onChange={(e) => onFormChange("name", e.target.value)} placeholder="Acute pharyngitis" />
              {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
            </label>

            <label className="full">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => onFormChange("description", e.target.value)}
                placeholder="Short clinical description"
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
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Diagnosis Entry"}
              </button>
            </div>
          </form>
        </aside>
      </section>
    </section>
  );
}
