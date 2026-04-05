# Rx Pad Feature Tracker

Reviewed against the repository state on March 29, 2026.

## Product Goal

Rx Pad is aiming to support a small medical practice where a doctor can:

- register and search patients quickly
- document clinical findings and diagnoses
- create prescriptions efficiently
- print prescriptions in a clinic-specific template or letterhead

## Current Workflows In The Repo

1. Add a new patient with demographics, contact details, address, and free-text notes.
2. Search recent or existing patients by name, date of birth, or phone digits.
3. Open a patient chart and review demographics, prescriptions, notes, and timeline events.
4. Edit patient demographics after creation.
5. Add a diagnosis from the diagnosis dataset and review the dated diagnosis list on the patient chart.
6. Add a prescription from the medication dataset with default dose/frequency/duration values.
7. Inactivate or reactivate prescriptions.
8. Add timestamped patient notes.
9. Print a patient summary.
10. Manage reusable medication and diagnosis dataset entries.
11. Deploy on Cloudflare Pages with D1 and optional Cloudflare Access protection.

## Implemented Features

### Platform And Operations

- [x] Cloudflare Pages deployment model with Pages Functions and D1 persistence
- [x] Automatic database bootstrap and preview seed data
- [x] Cloudflare Access based authentication guidance using approved-email one-time PIN
- [x] Local seed script and local Cloudflare Pages testing flow
- [x] Unit, component, integration, and e2e coverage for core workflows

### Patient Management

- [x] Create patient records
- [x] Store demographics: first name, last name, DOB, gender
- [x] Store contact details: phone, email
- [x] Store address fields
- [x] Store free-text patient notes on the demographic record
- [x] Duplicate warnings for same name plus DOB and same phone number
- [x] Search patients by name, DOB, and phone digits
- [x] Paginated patient list with remembered page size
- [x] Edit patient details after creation

### Clinical Workflow

- [x] View a patient diagnosis list with the date each diagnosis was recorded
- [x] Add diagnoses from a searchable diagnosis dataset
- [x] View active and inactive prescriptions in the patient chart
- [x] Add prescriptions from a managed medication dataset
- [x] Prefill prescription details from dataset defaults
- [x] Detect duplicate active prescriptions and allow override after confirmation
- [x] Inactivate and reactivate prescriptions
- [x] Add timestamped chart notes
- [x] Generate timeline events for patient creation, updates, note creation, and prescription status changes
- [x] Print a patient summary from the chart

### Medication Dataset

- [x] Search medication presets
- [x] Add medication presets
- [x] Edit medication presets
- [x] Delete unused medication presets
- [x] Prevent deleting medication presets that are already referenced by prescriptions

### Diagnosis Dataset

- [x] Search diagnosis presets
- [x] Add diagnosis presets
- [x] Edit diagnosis presets
- [x] Delete unused diagnosis presets
- [x] Prevent deleting diagnosis presets that are already referenced by patient charts

### Localization

- [x] `en-US` and `en-IN` locale handling
- [x] Locale-aware DOB entry helpers
- [x] Locale-based default phone country code and postal code label

## Key Gaps Against The Product Goal

### Critical Gaps

- [ ] Printable prescription on clinic letterhead
  The current print flow generates a generic "Patient Summary" popup, not a prescription printout with clinic branding, doctor details, or a configurable template.
- [ ] Visit or encounter records
  There is no dedicated visit model for a consultation date, chief complaint, exam findings, diagnosis, treatment plan, and follow-up instructions.
- [ ] Prescription fields needed for real-world printing
  Current prescriptions track medication name, strength, dose, frequency, duration, and instructions, but not quantity, refills, route, form, start date, prescriber identity, signature block, or registration/license numbers.

### Important Gaps

- [ ] Clinic and prescriber settings
  The app needs a configurable place for clinic name, address, phone, logo, letterhead assets, doctor name, credentials, and regulatory identifiers.
- [ ] Patient safety context
  There is no allergies list, alert banner, medication contraindication check, or chronic problem list.
- [ ] User-aware audit trail
  Timeline events are recorded, but they do not store which authenticated user performed the action.
- [ ] Print/export history
  Printed prescriptions are not versioned or stored as generated documents.
- [ ] Patient lifecycle controls
  There is no archive, deactivate, merge-duplicate, or delete workflow for patient charts.

### Useful Follow-On Gaps

- [ ] Appointment or visit scheduling
- [ ] File attachments for reports, scans, or lab results
- [ ] Editing or correcting prior chart notes with audit history
- [ ] Better clinical search filters such as active prescriptions only, recent visits, or city/phone filters
- [ ] Backup/export/import workflow for practice ownership and disaster recovery

## Recommended Build Order

### Phase 1: Must-Have For A Working Doctor Workflow

- [ ] Add a dedicated encounter model
- [ ] Add structured diagnosis fields to each encounter
- [ ] Add configurable clinic and doctor profile settings
- [ ] Expand prescription data model for print-safe prescribing
- [ ] Build printable prescription output with configurable template and letterhead
- [ ] Save printable prescription records to the patient chart

### Phase 2: Safety And Operational Readiness

- [ ] Add allergies and patient alerts
- [ ] Add actor-aware audit logging tied to Cloudflare Access identity
- [ ] Add patient archive and duplicate-management tools
- [ ] Add export and backup workflow

### Phase 3: Practice Efficiency

- [ ] Add scheduling or appointment tracking
- [ ] Add attachments for labs and supporting documents
- [ ] Add richer chart search and reporting

## Feature Backlog

Use this list as the ongoing tracker.

### Now

- [ ] Prescription print template with clinic letterhead
- [ ] Clinic settings page for branding and prescriber details
- [ ] Prescription fields: quantity, refills, route, form, start date
- [ ] Prescription signature block and provider registration fields

### Next

- [ ] Allergy and alert section on patient chart
- [ ] Audit log with acting user identity
- [ ] Patient archive and duplicate merge flow
- [ ] Encounter record: visit date, complaint, assessment, plan, follow-up
- [ ] Printable PDF export storage or regeneration flow

### Later

- [ ] Appointment scheduling
- [ ] Attachments for reports and lab files
- [ ] Reporting dashboard for active patients and common prescriptions
- [ ] Import and export tools

## Notes

- The repo is already a solid base for patient registration plus basic prescription tracking.
- The biggest delta between the current app and the target clinic workflow is the lack of structured diagnosis plus true prescription printing.
- Once those two areas are in place, Rx Pad can evolve from a lightweight charting helper into a usable small-practice prescribing workflow.
