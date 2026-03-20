"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";
import type {
  MedicationOption,
  PatientDetail,
  PatientEventRecord,
  PatientNoteRecord,
  PatientSummary,
  PrescriptionRecord
} from "@/types/patient";

type PrescriptionFormState = {
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type PatientEditFormState = {
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

const initialPrescriptionForm: PrescriptionFormState = {
  strength: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: ""
};

const initialPatientEditForm: PatientEditFormState = {
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

const defaultPrescriptionTemplate = {
  dose: "1 tablet",
  frequency: "Twice daily",
  duration: "7 days",
  instructions: ""
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatPatientPhone(phoneCountryCode: string | null, phone: string | null): string {
  if (!phone) return "Not provided";
  return phoneCountryCode ? `${phoneCountryCode} ${phone}` : phone;
}

function getAgeFromDob(dob: string): string {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Unknown";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age -= 1;

  return age >= 0 ? `${age}` : "Unknown";
}

function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toPatientEditForm(patient: PatientDetail): PatientEditFormState {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: toDateInputValue(patient.dob),
    gender: patient.gender,
    phoneCountryCode: patient.phoneCountryCode ?? DEFAULT_COUNTRY_CODE,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    addressLine1: patient.addressLine1 ?? "",
    addressLine2: patient.addressLine2 ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
    postalCode: patient.postalCode ?? "",
    notes: patient.notes ?? ""
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickDefaultStrength(commonStrengths: string | null): string {
  if (!commonStrengths) return "";
  const first = commonStrengths
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  return first ?? "";
}

function PatientsSearchContent() {
  const searchParams = useSearchParams();
  const createdId = useMemo(() => searchParams.get("created"), [searchParams]);
  const createdWarning = useMemo(() => searchParams.get("warning"), [searchParams]);

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [patientEvents, setPatientEvents] = useState<PatientEventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [medicationQuery, setMedicationQuery] = useState("");
  const [medicationOptions, setMedicationOptions] = useState<MedicationOption[]>([]);
  const [medicationLoading, setMedicationLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationOption | null>(null);

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormState>(initialPrescriptionForm);
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const [prescriptionSuccess, setPrescriptionSuccess] = useState<string | null>(null);
  const [prescriptionFieldErrors, setPrescriptionFieldErrors] = useState<Record<string, string>>({});
  const [showInactivePrescriptions, setShowInactivePrescriptions] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [showAddPrescriptionForm, setShowAddPrescriptionForm] = useState(false);
  const [patientNotes, setPatientNotes] = useState<PatientNoteRecord[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState<PatientEditFormState>(initialPatientEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editWarnings, setEditWarnings] = useState<string[]>([]);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const activePrescriptions = useMemo(() => prescriptions.filter((item) => item.isActive), [prescriptions]);
  const inactivePrescriptions = useMemo(() => prescriptions.filter((item) => !item.isActive), [prescriptions]);
  const timelineEvents = useMemo(() => [...patientEvents].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [patientEvents]);

  async function loadPrescriptions(patientId: string) {
    setPrescriptionsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/prescriptions`);
      const payload = (await response.json()) as PrescriptionRecord[] | { message?: string };
      if (!response.ok) {
        setPrescriptionError((payload as { message?: string }).message ?? "Could not load prescriptions.");
        return;
      }
      setPrescriptions(payload as PrescriptionRecord[]);
    } catch {
      setPrescriptionError("Could not load prescriptions.");
    } finally {
      setPrescriptionsLoading(false);
    }
  }

  async function loadPatientNotes(patientId: string) {
    setNoteLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/notes`);
      const payload = (await response.json()) as PatientNoteRecord[] | { message?: string };
      if (!response.ok) {
        setNoteError((payload as { message?: string }).message ?? "Could not load notes.");
        return;
      }
      setPatientNotes(payload as PatientNoteRecord[]);
    } catch {
      setNoteError("Could not load notes.");
    } finally {
      setNoteLoading(false);
    }
  }

  async function loadPatientEvents(patientId: string) {
    setEventsLoading(true);
    setTimelineError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/events`);
      const payload = (await response.json()) as PatientEventRecord[] | { message?: string };
      if (!response.ok) {
        setTimelineError((payload as { message?: string }).message ?? "Could not load patient timeline.");
        return;
      }
      setPatientEvents(payload as PatientEventRecord[]);
    } catch {
      setTimelineError("Could not load patient timeline.");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadPatients(searchValue: string, signal?: AbortSignal) {
    setListLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patients?query=${encodeURIComponent(searchValue)}`, {
        signal
      });
      const payload = (await response.json()) as PatientSummary[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Failed to fetch patients.");
        return;
      }
      setPatients(payload as PatientSummary[]);
    } catch (fetchError: unknown) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      setError("Could not load patients.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      await loadPatients(query, controller.signal);
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (createdId) {
      setSelectedId(createdId);
    }
  }, [createdId]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedPatient(null);
      setPrescriptions([]);
      setPatientNotes([]);
      setPatientEvents([]);
      setEventsLoading(false);
      setTimelineError(null);
      setShowAddPrescriptionForm(false);
      setShowNoteForm(false);
      setShowEditForm(false);
      setEditForm(initialPatientEditForm);
      setEditFieldErrors({});
      setEditWarnings([]);
      return;
    }

    const controller = new AbortController();
    async function loadDetail() {
      setDetailLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/patients/${selectedId}`, { signal: controller.signal });
        const payload = (await response.json()) as PatientDetail | { message?: string };
        if (!response.ok) {
          setError((payload as { message?: string }).message ?? "Failed to load patient details.");
          return;
        }
        setSelectedPatient(payload as PatientDetail);
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("Could not load patient details.");
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
    loadPrescriptions(selectedId);
    loadPatientNotes(selectedId);
    loadPatientEvents(selectedId);
    setPrescriptionError(null);
    setPrescriptionSuccess(null);
    setNoteError(null);
    setNoteSuccess(null);
    setEditError(null);
    setEditSuccess(null);
    setEditWarnings([]);
    setEditFieldErrors({});
    setTimelineError(null);
    setNoteText("");
    setShowAddPrescriptionForm(false);
    setShowNoteForm(false);
    setShowEditForm(false);
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (selectedPatient) {
      setEditForm(toPatientEditForm(selectedPatient));
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedId) return;
    const search = medicationQuery.trim();
    if (search.length === 0) {
      setMedicationOptions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setMedicationLoading(true);
      try {
        const response = await fetch(`/api/medications?query=${encodeURIComponent(search)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as MedicationOption[] | { message?: string };
        if (!response.ok) {
          setPrescriptionError((payload as { message?: string }).message ?? "Could not load medications.");
          return;
        }
        setMedicationOptions(payload as MedicationOption[]);
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setPrescriptionError("Could not load medications.");
      } finally {
        setMedicationLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [medicationQuery, selectedId]);

  function onPrescriptionChange<K extends keyof PrescriptionFormState>(key: K, value: PrescriptionFormState[K]) {
    setPrescriptionForm((prev) => ({ ...prev, [key]: value }));
    setPrescriptionFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onMedicationInputChange(value: string) {
    setMedicationQuery(value);
    if (selectedMedication && value !== selectedMedication.name) {
      setSelectedMedication(null);
      setPrescriptionFieldErrors((prev) => {
        const next = { ...prev };
        delete next.medicationId;
        return next;
      });
    }
  }

  function selectMedication(medication: MedicationOption) {
    setSelectedMedication(medication);
    setMedicationQuery(medication.name);
    setMedicationOptions([]);
    setPrescriptionForm((prev) => ({
      ...prev,
      strength: pickDefaultStrength(medication.commonStrengths),
      dose: medication.defaultDose || prev.dose || defaultPrescriptionTemplate.dose,
      frequency: medication.defaultFrequency || prev.frequency || defaultPrescriptionTemplate.frequency,
      duration: medication.defaultDuration || prev.duration || defaultPrescriptionTemplate.duration,
      instructions: medication.defaultInstructions || prev.instructions || defaultPrescriptionTemplate.instructions
    }));
    setPrescriptionFieldErrors((prev) => {
      const next = { ...prev };
      delete next.medicationId;
      return next;
    });
  }

  async function submitPrescription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) {
      setPrescriptionError("Select a patient first.");
      return;
    }
    if (!selectedMedication) {
      setPrescriptionFieldErrors((prev) => ({
        ...prev,
        medicationId: "Select a medication from search results."
      }));
      return;
    }

    setPrescriptionSaving(true);
    setPrescriptionError(null);
    setPrescriptionSuccess(null);
    setPrescriptionFieldErrors({});

    try {
      const response = await fetch(`/api/patients/${selectedId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: selectedMedication.id,
          ...prescriptionForm
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          setPrescriptionFieldErrors(payload.fieldErrors as Record<string, string>);
        }
        setPrescriptionError(payload?.message ?? "Could not save prescription.");
        return;
      }

      setPrescriptionForm(initialPrescriptionForm);
      setSelectedMedication(null);
      setMedicationQuery("");
      setPrescriptionSuccess("Prescription added successfully.");
      await loadPrescriptions(selectedId);
    } catch {
      setPrescriptionError("Network error while saving prescription.");
    } finally {
      setPrescriptionSaving(false);
    }
  }

  async function togglePrescriptionStatus(prescriptionId: string, makeActive: boolean) {
    if (!selectedId) return;
    setStatusUpdatingId(prescriptionId);
    setPrescriptionError(null);
    setPrescriptionSuccess(null);

    try {
      const response = await fetch(`/api/patients/${selectedId}/prescriptions/${prescriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: makeActive })
      });

      const payload = await response.json();
      if (!response.ok) {
        setPrescriptionError(payload?.message ?? "Could not update prescription status.");
        return;
      }

      setPrescriptionSuccess(makeActive ? "Prescription marked active." : "Prescription inactivated.");
      await loadPrescriptions(selectedId);
    } catch {
      setPrescriptionError("Network error while updating prescription status.");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function submitPatientNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;

    const trimmed = noteText.trim();
    if (!trimmed) {
      setNoteError("Note is required.");
      return;
    }

    setNoteSaving(true);
    setNoteError(null);
    setNoteSuccess(null);

    try {
      const response = await fetch(`/api/patients/${selectedId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed })
      });
      const payload = await response.json();
      if (!response.ok) {
        setNoteError(payload?.message ?? "Could not save note.");
        return;
      }

      setNoteText("");
      setNoteSuccess("Note added.");
      setShowNoteForm(false);
      await loadPatientNotes(selectedId);
    } catch {
      setNoteError("Network error while saving note.");
    } finally {
      setNoteSaving(false);
    }
  }

  function onEditChange<K extends keyof PatientEditFormState>(key: K, value: PatientEditFormState[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function submitPatientEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;

    setEditSaving(true);
    setEditError(null);
    setEditSuccess(null);
    setEditWarnings([]);
    setEditFieldErrors({});

    try {
      const response = await fetch(`/api/patients/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
          setEditFieldErrors(payload.fieldErrors as Record<string, string>);
        }
        if (Array.isArray(payload?.warnings)) {
          setEditWarnings(payload.warnings as string[]);
        }
        setEditError(payload?.message ?? "Could not save patient.");
        return;
      }

      const warnings = Array.isArray(payload?.warnings) ? (payload.warnings as string[]) : [];
      setSelectedPatient(payload as PatientDetail);
      setEditWarnings(warnings);
      setEditSuccess("Patient updated successfully.");
      setShowEditForm(true);
      await loadPatients(query);
      await loadPatientEvents(selectedId);
    } catch {
      setEditError("Network error while saving patient.");
    } finally {
      setEditSaving(false);
    }
  }

  function handlePrintSummary() {
    if (!selectedPatient) return;

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;

    const noteRows = patientNotes
      .map(
        (note) => `<li><strong>${escapeHtml(formatDateTime(note.createdAt))}</strong><br />${escapeHtml(note.note)}</li>`
      )
      .join("");
    const activeRows = activePrescriptions
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.medicationName)}</strong><br />${escapeHtml(item.strength)} | ${escapeHtml(item.dose)} | ${escapeHtml(item.frequency)} | ${escapeHtml(item.duration)}</li>`
      )
      .join("");
    const inactiveRows = inactivePrescriptions
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.medicationName)}</strong><br />${escapeHtml(item.strength)} | ${escapeHtml(item.dose)} | ${escapeHtml(item.frequency)} | ${escapeHtml(item.duration)}</li>`
      )
      .join("");
    const timelineRows = timelineEvents
      .map(
        (item) =>
          `<li><strong>${escapeHtml(formatDateTime(item.createdAt))}</strong> ${escapeHtml(item.title)}${item.details ? `<br />${escapeHtml(item.details)}` : ""}</li>`
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>Patient Summary</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1, h2, h3 { margin: 0 0 12px; }
            section { margin-bottom: 20px; }
            ul { margin: 8px 0 0; padding-left: 20px; }
            li { margin-bottom: 10px; }
            .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            .muted { color: #475569; }
          </style>
        </head>
        <body>
          <h1>Patient Summary</h1>
          <section class="card">
            <div class="meta">
              <div><strong>Name:</strong> ${escapeHtml(selectedPatient.firstName)} ${escapeHtml(selectedPatient.lastName)}</div>
              <div><strong>DOB:</strong> ${escapeHtml(formatDate(selectedPatient.dob))}</div>
              <div><strong>Age:</strong> ${escapeHtml(getAgeFromDob(selectedPatient.dob))}</div>
              <div><strong>Gender:</strong> ${escapeHtml(selectedPatient.gender.replace(/_/g, " "))}</div>
              <div><strong>Phone:</strong> ${escapeHtml(formatPatientPhone(selectedPatient.phoneCountryCode, selectedPatient.phone))}</div>
              <div><strong>Email:</strong> ${escapeHtml(selectedPatient.email ?? "Not provided")}</div>
            </div>
          </section>
          <section>
            <h2>Active Prescriptions</h2>
            <ul>${activeRows || "<li class='muted'>No active prescriptions.</li>"}</ul>
          </section>
          <section>
            <h2>Inactive Prescriptions</h2>
            <ul>${inactiveRows || "<li class='muted'>No inactive prescriptions.</li>"}</ul>
          </section>
          <section>
            <h2>Notes</h2>
            <ul>${noteRows || "<li class='muted'>No notes available.</li>"}</ul>
          </section>
          <section>
            <h2>Timeline</h2>
            <ul>${timelineRows || "<li class='muted'>No timeline events available.</li>"}</ul>
          </section>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  function focusPrescriptionForm() {
    setShowAddPrescriptionForm(true);
    const target = document.getElementById("add-prescription");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section className="stack-lg">
      <div className="panel panel-hero">
        <p className="hero-kicker">Patient Lookup</p>
        <h1 className="section-title">Search Patients</h1>
        <p className="hint">Type a name, phone digits, or DOB to instantly filter your patient records.</p>
        <div className="pill-row">
          <span className="pill">Live Search</span>
          <span className="pill">Name + DOB + Phone</span>
          <span className="pill">{patients.length} Visible</span>
        </div>
      </div>

      <section className={selectedPatient ? "focus-layout" : "search-layout"}>
        {!selectedPatient ? (
          <div className="panel">
            <div className="panel-header">
              <h2 className="section-title">Results</h2>
              <span className="section-chip">{listLoading ? "Updating..." : `${patients.length} found`}</span>
            </div>
            <label>
              <span>Search by name, date of birth (YYYY-MM-DD), or phone</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Jane, 1986-05-19, 5551234"
              />
            </label>

            {createdId ? <div className="msg success">Patient saved successfully.</div> : null}
            {createdWarning ? <div className="msg warning">{createdWarning}</div> : null}
            {error ? <div className="msg error">{error}</div> : null}

            <ul className="patient-list" aria-live="polite">
              {listLoading ? <li className="hint">Loading patients...</li> : null}
              {!listLoading && patients.length === 0 ? <li className="hint">No patients found.</li> : null}
              {patients.map((patient) => (
                <li
                  key={patient.id}
                  className={`patient-item ${selectedId === patient.id ? "active" : ""}`}
                  onClick={() => setSelectedId(patient.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(patient.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${patient.firstName} ${patient.lastName}`}
                >
                  <p className="patient-name">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="patient-meta">
                    DOB: {formatDate(patient.dob)} | Phone: {formatPatientPhone(patient.phoneCountryCode, patient.phone)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <aside className="panel" aria-live="polite">
          <div className="panel-header">
            <h2 className="section-title">Patient Overview</h2>
            <span className="section-chip">{selectedPatient ? "In focus" : "No selection"}</span>
          </div>

          {!selectedPatient ? (
            <>
              <label>
                <span>Search by name, date of birth (YYYY-MM-DD), or phone</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Jane, 1986-05-19, 5551234"
                />
              </label>
              {error ? <div className="msg error">{error}</div> : null}
              {detailLoading ? <p className="hint">Loading details...</p> : null}
              <p className="hint">Search and select a patient to open the focused prescription view.</p>
            </>
          ) : null}

          {selectedPatient ? (
            <>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => {
                    setEditForm(toPatientEditForm(selectedPatient));
                    setShowEditForm((prev) => !prev);
                    setEditError(null);
                    setEditSuccess(null);
                    setEditWarnings([]);
                    setEditFieldErrors({});
                  }}
                >
                  {showEditForm ? "Close Edit" : "Edit Patient"}
                </button>
                <button type="button" className="btn btn-soft" onClick={handlePrintSummary}>
                  Print Summary
                </button>
                <button type="button" className="btn btn-soft" onClick={focusPrescriptionForm}>
                  Add New Prescription
                </button>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedPatient(null);
                    setMedicationQuery("");
                    setSelectedMedication(null);
                    setPrescriptionForm(initialPrescriptionForm);
                  }}
                  >
                    Change Patient
                  </button>
              </div>

              {showEditForm ? (
                <section className="rx-block">
                  <div className="panel-header">
                    <h3 className="section-title">Edit Patient</h3>
                    <span className="section-chip">Update demographics</span>
                  </div>

                  {editWarnings.length > 0 ? (
                    <div className="msg warning">
                      {editWarnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                      ))}
                    </div>
                  ) : null}
                  {editError ? <div className="msg error">{editError}</div> : null}
                  {editSuccess ? <div className="msg success">{editSuccess}</div> : null}

                  <form className="patient-edit-form" onSubmit={submitPatientEdit} noValidate>
                    <div className="field-grid">
                      <label>
                        <span className="required">First Name</span>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => onEditChange("firstName", e.target.value)}
                        />
                        {editFieldErrors.firstName ? <span className="field-error">{editFieldErrors.firstName}</span> : null}
                      </label>

                      <label>
                        <span className="required">Last Name</span>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => onEditChange("lastName", e.target.value)}
                        />
                        {editFieldErrors.lastName ? <span className="field-error">{editFieldErrors.lastName}</span> : null}
                      </label>

                      <label>
                        <span className="required">Date of Birth</span>
                        <input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => onEditChange("dob", e.target.value)}
                        />
                        {editFieldErrors.dob ? <span className="field-error">{editFieldErrors.dob}</span> : null}
                      </label>

                      <label>
                        <span className="required">Gender</span>
                        <select
                          value={editForm.gender}
                          onChange={(e) => onEditChange("gender", e.target.value as PatientEditFormState["gender"])}
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                        {editFieldErrors.gender ? <span className="field-error">{editFieldErrors.gender}</span> : null}
                      </label>

                      <div className="full section-divider">Contact</div>

                      <label>
                        <span>Phone</span>
                        <div className="phone-input-group">
                          <select
                            aria-label="Phone country code"
                            value={editForm.phoneCountryCode}
                            onChange={(e) => onEditChange("phoneCountryCode", e.target.value)}
                          >
                            {COUNTRY_CODES.map((entry) => (
                              <option key={entry.code} value={entry.code}>
                                {entry.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => onEditChange("phone", e.target.value)}
                            placeholder="Local number"
                          />
                        </div>
                        {editFieldErrors.phoneCountryCode ? (
                          <span className="field-error">{editFieldErrors.phoneCountryCode}</span>
                        ) : null}
                        {editFieldErrors.phone ? <span className="field-error">{editFieldErrors.phone}</span> : null}
                      </label>

                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => onEditChange("email", e.target.value)}
                        />
                      </label>

                      <div className="full section-divider">Address</div>

                      <label className="full">
                        <span>Address Line 1</span>
                        <input
                          type="text"
                          value={editForm.addressLine1}
                          onChange={(e) => onEditChange("addressLine1", e.target.value)}
                        />
                      </label>

                      <label className="full">
                        <span>Address Line 2</span>
                        <input
                          type="text"
                          value={editForm.addressLine2}
                          onChange={(e) => onEditChange("addressLine2", e.target.value)}
                        />
                      </label>

                      <label>
                        <span>City</span>
                        <input type="text" value={editForm.city} onChange={(e) => onEditChange("city", e.target.value)} />
                      </label>

                      <label>
                        <span>State</span>
                        <input type="text" value={editForm.state} onChange={(e) => onEditChange("state", e.target.value)} />
                      </label>

                      <label>
                        <span>Postal Code</span>
                        <input
                          type="text"
                          value={editForm.postalCode}
                          onChange={(e) => onEditChange("postalCode", e.target.value)}
                        />
                      </label>

                      <div className="full section-divider">Additional Notes</div>

                      <label className="full">
                        <span>Notes</span>
                        <textarea value={editForm.notes} onChange={(e) => onEditChange("notes", e.target.value)} />
                      </label>
                    </div>

                    <div className="actions">
                      <button type="submit" className="btn" disabled={editSaving}>
                        {editSaving ? "Saving..." : "Save Patient Changes"}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              <div className="demographics-inline">
                <div className="demographic-pill">
                  <small>Name</small>
                  <strong>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </strong>
                </div>
                <div className="demographic-pill">
                  <small>Age / DOB</small>
                  <strong>
                    {getAgeFromDob(selectedPatient.dob)} years | {formatDate(selectedPatient.dob)}
                  </strong>
                </div>
                <div className="demographic-pill">
                  <small>Gender</small>
                  <strong>{selectedPatient.gender.replace(/_/g, " ")}</strong>
                </div>
                <div className="demographic-pill">
                  <small>Phone</small>
                  <strong>{formatPatientPhone(selectedPatient.phoneCountryCode, selectedPatient.phone)}</strong>
                </div>
              </div>

              <section className="rx-block">
                <div className="panel-header">
                  <h3 className="section-title">Patient Timeline</h3>
                  <span className="section-chip">{eventsLoading ? "Loading..." : `${timelineEvents.length} events`}</span>
                </div>
                {timelineError ? <div className="msg warning">{timelineError}</div> : null}
                {eventsLoading ? <p className="hint">Loading timeline...</p> : null}
                {!eventsLoading && timelineEvents.length === 0 ? <p className="hint">No timeline events available.</p> : null}
                <ul className="timeline-list">
                  {timelineEvents.map((event) => (
                    <li key={event.id} className="timeline-item">
                      <div className="timeline-top">
                        <strong>{event.title}</strong>
                        <span>{formatDateTime(event.createdAt)}</span>
                      </div>
                      <p>{event.details ?? event.type.replace(/_/g, " ").toLowerCase()}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rx-summary-grid">
                <div className="rx-summary-card">
                  <div className="panel-header">
                    <h3 className="section-title">Previous Notes</h3>
                    <button type="button" className="btn btn-soft btn-xs" onClick={() => setShowNoteForm(true)}>
                      Add Note
                    </button>
                  </div>

                  {showNoteForm ? (
                    <form onSubmit={submitPatientNote} className="note-compose-form">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add visit note..."
                      />
                      <div className="rx-inline-actions">
                        <button type="submit" className="btn btn-soft btn-xs" disabled={noteSaving}>
                          {noteSaving ? "Saving..." : "Save Note"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-soft btn-xs"
                          onClick={() => {
                            setShowNoteForm(false);
                            setNoteText("");
                            setNoteError(null);
                            setNoteSuccess(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {noteError ? <div className="msg error">{noteError}</div> : null}
                  {noteSuccess ? <div className="msg success">{noteSuccess}</div> : null}
                  {noteLoading ? <p className="hint">Loading notes...</p> : null}
                  {!noteLoading && patientNotes.length === 0 ? <p className="hint">No notes available.</p> : null}
                  <ul className="rx-mini-list">
                    {patientNotes.map((note) => (
                      <li key={note.id}>
                        <strong>{formatDate(note.createdAt)}:</strong>
                        <span>{note.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {showAddPrescriptionForm ? (
                <section className="rx-block" id="add-prescription">
                  <div className="panel-header">
                    <h3 className="section-title">Add Prescription</h3>
                    <div className="rx-inline-actions">
                      <span className="section-chip">{prescriptions.length} total</span>
                      <button type="button" className="btn btn-soft btn-xs" onClick={() => setShowAddPrescriptionForm(false)}>
                        Close
                      </button>
                    </div>
                  </div>

                  <form className="rx-form-grid" onSubmit={submitPrescription} noValidate>
                    <label className="full">
                      <span className="required">Search Medication</span>
                      <input
                        type="search"
                        value={medicationQuery}
                        onChange={(e) => onMedicationInputChange(e.target.value)}
                        placeholder="Type medicine name (example: Amoxicillin)"
                      />
                      {selectedMedication ? (
                        <span className="rx-selected">
                          Selected: {selectedMedication.name}
                          {selectedMedication.commonStrengths ? ` (${selectedMedication.commonStrengths})` : ""}
                        </span>
                      ) : null}
                      {prescriptionFieldErrors.medicationId ? (
                        <span className="field-error">{prescriptionFieldErrors.medicationId}</span>
                      ) : null}
                    </label>

                    {medicationLoading ? <p className="hint full">Searching medications...</p> : null}
                    {!medicationLoading && medicationOptions.length > 0 ? (
                      <ul className="rx-option-list full">
                        {medicationOptions.map((medication) => (
                          <li key={medication.id}>
                            <button type="button" className="rx-option" onClick={() => selectMedication(medication)}>
                              <strong>{medication.name}</strong>
                              <small>{medication.commonStrengths ?? "No predefined strengths"}</small>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <label>
                      <span className="required">Strength</span>
                      <input
                        type="text"
                        value={prescriptionForm.strength}
                        onChange={(e) => onPrescriptionChange("strength", e.target.value)}
                        placeholder="500 mg"
                      />
                      {prescriptionFieldErrors.strength ? <span className="field-error">{prescriptionFieldErrors.strength}</span> : null}
                    </label>

                    <label>
                      <span className="required">Dose</span>
                      <input
                        type="text"
                        value={prescriptionForm.dose}
                        onChange={(e) => onPrescriptionChange("dose", e.target.value)}
                        placeholder="1 tablet"
                      />
                      {prescriptionFieldErrors.dose ? <span className="field-error">{prescriptionFieldErrors.dose}</span> : null}
                    </label>

                    <label>
                      <span className="required">Frequency</span>
                      <input
                        type="text"
                        value={prescriptionForm.frequency}
                        onChange={(e) => onPrescriptionChange("frequency", e.target.value)}
                        placeholder="Twice daily"
                      />
                      {prescriptionFieldErrors.frequency ? <span className="field-error">{prescriptionFieldErrors.frequency}</span> : null}
                    </label>

                    <label>
                      <span className="required">Duration</span>
                      <input
                        type="text"
                        value={prescriptionForm.duration}
                        onChange={(e) => onPrescriptionChange("duration", e.target.value)}
                        placeholder="7 days"
                      />
                      {prescriptionFieldErrors.duration ? <span className="field-error">{prescriptionFieldErrors.duration}</span> : null}
                    </label>

                    <label className="full">
                      <span>Instructions</span>
                      <textarea
                        value={prescriptionForm.instructions}
                        onChange={(e) => onPrescriptionChange("instructions", e.target.value)}
                        placeholder="Take after meals"
                      />
                    </label>

                    <div className="actions full">
                      <button type="submit" className="btn" disabled={prescriptionSaving}>
                        {prescriptionSaving ? "Saving..." : "Add Prescription"}
                      </button>
                    </div>
                  </form>

                  {prescriptionError ? <div className="msg error">{prescriptionError}</div> : null}
                  {prescriptionSuccess ? <div className="msg success">{prescriptionSuccess}</div> : null}
                </section>
              ) : null}

              <section className="rx-block">
                <div className="rx-history">
                  <div className="panel-header">
                    <h3 className="section-title">Active Prescriptions</h3>
                    <span className="section-chip">{activePrescriptions.length}</span>
                  </div>
                  {prescriptionsLoading ? <p className="hint">Loading prescriptions...</p> : null}
                  {!prescriptionsLoading && activePrescriptions.length === 0 ? <p className="hint">No active prescriptions.</p> : null}

                  <ul className="rx-list">
                    {activePrescriptions.map((prescription) => (
                      <li key={prescription.id} className="rx-card">
                        <p className="rx-title">{prescription.medicationName}</p>
                        <p className="rx-meta">
                          Strength: {prescription.strength} | Dose: {prescription.dose}
                        </p>
                        <p className="rx-meta">
                          Frequency: {prescription.frequency} | Duration: {prescription.duration}
                        </p>
                        <p className="rx-meta">Added: {formatDate(prescription.createdAt)}</p>
                        {prescription.instructions ? <p className="rx-note">Instructions: {prescription.instructions}</p> : null}
                        <div className="rx-row-actions">
                          <button
                            type="button"
                            className="btn btn-soft btn-xs"
                            onClick={() => togglePrescriptionStatus(prescription.id, false)}
                            disabled={statusUpdatingId === prescription.id}
                          >
                            {statusUpdatingId === prescription.id ? "Updating..." : "Inactivate"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="panel-header">
                    <h3 className="section-title">Inactive Prescriptions</h3>
                    <button
                      type="button"
                      className="btn btn-soft btn-xs"
                      onClick={() => setShowInactivePrescriptions((prev) => !prev)}
                    >
                      {showInactivePrescriptions ? "Hide" : "Show"} ({inactivePrescriptions.length})
                    </button>
                  </div>

                  {showInactivePrescriptions ? (
                    <>
                      {!prescriptionsLoading && inactivePrescriptions.length === 0 ? (
                        <p className="hint">No inactive prescriptions.</p>
                      ) : null}
                      <ul className="rx-list">
                        {inactivePrescriptions.map((prescription) => (
                          <li key={prescription.id} className="rx-card rx-card-inactive">
                            <p className="rx-title">{prescription.medicationName}</p>
                            <p className="rx-meta">
                              Strength: {prescription.strength} | Dose: {prescription.dose}
                            </p>
                            <p className="rx-meta">
                              Frequency: {prescription.frequency} | Duration: {prescription.duration}
                            </p>
                            <p className="rx-meta">
                              Inactivated: {prescription.inactivatedAt ? formatDate(prescription.inactivatedAt) : "Unknown"}
                            </p>
                            {prescription.instructions ? <p className="rx-note">Instructions: {prescription.instructions}</p> : null}
                            <div className="rx-row-actions">
                              <button
                                type="button"
                                className="btn btn-soft btn-xs"
                                onClick={() => togglePrescriptionStatus(prescription.id, true)}
                                disabled={statusUpdatingId === prescription.id}
                              >
                                {statusUpdatingId === prescription.id ? "Updating..." : "Activate"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </aside>
      </section>
    </section>
  );
}

export default function SearchPatientsPage() {
  return (
    <Suspense fallback={<section className="panel">Loading patient search...</section>}>
      <PatientsSearchContent />
    </Suspense>
  );
}
