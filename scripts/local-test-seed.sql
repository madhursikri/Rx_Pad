PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Patient (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phoneCountryCode TEXT,
  phone TEXT,
  phoneE164 TEXT,
  email TEXT,
  addressLine1 TEXT,
  addressLine2 TEXT,
  city TEXT,
  state TEXT,
  postalCode TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_name ON Patient(lastName, firstName);
CREATE INDEX IF NOT EXISTS idx_patient_dob ON Patient(dob);
CREATE INDEX IF NOT EXISTS idx_patient_phone ON Patient(phone);
CREATE INDEX IF NOT EXISTS idx_patient_phone_e164 ON Patient(phoneE164);

CREATE TABLE IF NOT EXISTS PatientNote (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  note TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_note_patient_created ON PatientNote(patientId, createdAt);

CREATE TABLE IF NOT EXISTS Diagnosis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_name ON Diagnosis(name);

CREATE TABLE IF NOT EXISTS PatientDiagnosis (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  diagnosisId TEXT NOT NULL,
  diagnosisName TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE,
  FOREIGN KEY (diagnosisId) REFERENCES Diagnosis(id)
);

CREATE INDEX IF NOT EXISTS idx_patient_diagnosis_patient_created ON PatientDiagnosis(patientId, createdAt);
CREATE INDEX IF NOT EXISTS idx_patient_diagnosis_diagnosis ON PatientDiagnosis(diagnosisId);

CREATE TABLE IF NOT EXISTS PatientEvent (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_event_patient_created ON PatientEvent(patientId, createdAt);
CREATE INDEX IF NOT EXISTS idx_patient_event_patient_type ON PatientEvent(patientId, type);

CREATE TABLE IF NOT EXISTS Medication (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  commonStrengths TEXT,
  defaultDose TEXT,
  defaultFrequency TEXT,
  defaultDuration TEXT,
  defaultInstructions TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medication_name ON Medication(name);

CREATE TABLE IF NOT EXISTS Prescription (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  medicationId TEXT NOT NULL,
  medicationName TEXT NOT NULL,
  strength TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  inactivatedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE,
  FOREIGN KEY (medicationId) REFERENCES Medication(id)
);

CREATE INDEX IF NOT EXISTS idx_prescription_patient_created ON Prescription(patientId, createdAt);
CREATE INDEX IF NOT EXISTS idx_prescription_patient_active ON Prescription(patientId, isActive);
CREATE INDEX IF NOT EXISTS idx_prescription_medication ON Prescription(medicationId);

DELETE FROM PatientEvent;
DELETE FROM PatientNote;
DELETE FROM PatientDiagnosis;
DELETE FROM Prescription;
DELETE FROM Patient;
DELETE FROM Diagnosis;
DELETE FROM Medication;

INSERT INTO Medication (id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions, createdAt, updatedAt) VALUES
('med-amoxicillin', 'Amoxicillin', '250 mg, 500 mg', '1 capsule', 'Three times daily', '7 days', 'Take after food', '2026-03-01T08:00:00.000Z', '2026-03-01T08:00:00.000Z'),
('med-metformin', 'Metformin', '500 mg, 850 mg, 1000 mg', '1 tablet', 'Twice daily', '30 days', 'Take with meals', '2026-03-01T08:05:00.000Z', '2026-03-01T08:05:00.000Z'),
('med-lisinopril', 'Lisinopril', '5 mg, 10 mg, 20 mg', '1 tablet', 'Once daily', '30 days', 'Check blood pressure regularly', '2026-03-01T08:10:00.000Z', '2026-03-01T08:10:00.000Z'),
('med-ibuprofen', 'Ibuprofen', '200 mg, 400 mg, 600 mg', '1 tablet', 'Every 8 hours as needed', '5 days', 'Take with food', '2026-03-01T08:15:00.000Z', '2026-03-01T08:15:00.000Z'),
('med-albuterol', 'Albuterol Inhaler', '90 mcg/actuation', '2 puffs', 'Every 4-6 hours as needed', '30 days', 'Use spacer if available', '2026-03-01T08:20:00.000Z', '2026-03-01T08:20:00.000Z'),
('med-sertraline', 'Sertraline', '25 mg, 50 mg, 100 mg', '1 tablet', 'Once daily', '30 days', 'Take at same time daily', '2026-03-01T08:25:00.000Z', '2026-03-01T08:25:00.000Z');

INSERT INTO Diagnosis (id, name, description, createdAt, updatedAt) VALUES
('diag-acute-pharyngitis', 'Acute pharyngitis', 'Sore throat with or without fever.', '2026-03-01T09:00:00.000Z', '2026-03-01T09:00:00.000Z'),
('diag-type-2-diabetes', 'Type 2 diabetes mellitus', 'Diabetes without documented complications.', '2026-03-01T09:05:00.000Z', '2026-03-01T09:05:00.000Z'),
('diag-essential-hypertension', 'Essential hypertension', 'Primary high blood pressure.', '2026-03-01T09:10:00.000Z', '2026-03-01T09:10:00.000Z'),
('diag-major-depression', 'Major depressive disorder', 'Depressive episode, unspecified.', '2026-03-01T09:15:00.000Z', '2026-03-01T09:15:00.000Z'),
('diag-asthma', 'Asthma', 'Chronic reactive airway disease.', '2026-03-01T09:20:00.000Z', '2026-03-01T09:20:00.000Z'),
('diag-hyperlipidemia', 'Hyperlipidemia', 'Elevated lipids and cholesterol.', '2026-03-01T09:25:00.000Z', '2026-03-01T09:25:00.000Z');

INSERT INTO Patient (id, firstName, lastName, dob, gender, phoneCountryCode, phone, phoneE164, email, addressLine1, addressLine2, city, state, postalCode, notes, createdAt, updatedAt) VALUES
('patient-emma-carter', 'Emma', 'Carter', '1988-04-12T00:00:00.000Z', 'female', '+1', '4155550188', '14155550188', 'emma.carter@example.test', '145 Lakeview Ave', NULL, 'San Francisco', 'CA', '94107', 'Test patient with active and inactive prescriptions.', '2026-03-02T09:00:00.000Z', '2026-03-18T10:45:00.000Z'),
('patient-noah-kim', 'Noah', 'Kim', '1995-06-14T00:00:00.000Z', 'male', NULL, NULL, NULL, 'noah.kim@example.test', NULL, NULL, NULL, NULL, NULL, 'No phone provided. Good record for note and timeline testing.', '2026-03-03T11:15:00.000Z', '2026-03-19T15:20:00.000Z'),
('patient-priya-shah', 'Priya', 'Shah', '1974-05-06T00:00:00.000Z', 'female', '+971', '501234567', '971501234567', NULL, '24 Palm Residence', NULL, 'Dubai', NULL, NULL, 'Useful for international phone and chronic medication examples.', '2026-03-04T12:30:00.000Z', '2026-03-20T08:35:00.000Z');

INSERT INTO PatientDiagnosis (id, patientId, diagnosisId, diagnosisName, createdAt, updatedAt) VALUES
('pd-emma-pharyngitis', 'patient-emma-carter', 'diag-acute-pharyngitis', 'Acute pharyngitis', '2026-03-10T08:30:00.000Z', '2026-03-10T08:30:00.000Z'),
('pd-noah-depression', 'patient-noah-kim', 'diag-major-depression', 'Major depressive disorder', '2026-03-12T16:30:00.000Z', '2026-03-12T16:30:00.000Z'),
('pd-priya-diabetes', 'patient-priya-shah', 'diag-type-2-diabetes', 'Type 2 diabetes mellitus', '2026-03-13T07:45:00.000Z', '2026-03-13T07:45:00.000Z'),
('pd-priya-hypertension', 'patient-priya-shah', 'diag-essential-hypertension', 'Essential hypertension', '2026-03-20T08:00:00.000Z', '2026-03-20T08:00:00.000Z');

INSERT INTO Prescription (id, patientId, medicationId, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt) VALUES
('rx-emma-amoxicillin', 'patient-emma-carter', 'med-amoxicillin', 'Amoxicillin', '500 mg', '1 capsule', 'Three times daily', '7 days', 'Finish the full course.', 1, NULL, '2026-03-10T09:30:00.000Z', '2026-03-10T09:30:00.000Z'),
('rx-emma-ibuprofen', 'patient-emma-carter', 'med-ibuprofen', 'Ibuprofen', '400 mg', '1 tablet', 'Every 8 hours as needed', '5 days', 'Take with food for throat pain.', 0, '2026-03-16T14:00:00.000Z', '2026-03-12T13:15:00.000Z', '2026-03-16T14:00:00.000Z'),
('rx-noah-sertraline', 'patient-noah-kim', 'med-sertraline', 'Sertraline', '50 mg', '1 tablet', 'Once daily', '30 days', 'Take in the morning.', 1, NULL, '2026-03-08T10:00:00.000Z', '2026-03-08T10:00:00.000Z'),
('rx-priya-metformin', 'patient-priya-shah', 'med-metformin', 'Metformin', '500 mg', '1 tablet', 'Twice daily', '30 days', 'Take with breakfast and dinner.', 1, NULL, '2026-03-09T08:45:00.000Z', '2026-03-09T08:45:00.000Z'),
('rx-priya-lisinopril', 'patient-priya-shah', 'med-lisinopril', 'Lisinopril', '10 mg', '1 tablet', 'Once daily', '30 days', 'Monitor dizziness during the first week.', 1, NULL, '2026-03-11T16:10:00.000Z', '2026-03-11T16:10:00.000Z');

INSERT INTO PatientNote (id, patientId, note, createdAt, updatedAt) VALUES
('note-emma-1', 'patient-emma-carter', 'Patient reports sore throat for three days with mild fever at home.', '2026-03-10T09:00:00.000Z', '2026-03-10T09:00:00.000Z'),
('note-emma-2', 'patient-emma-carter', 'Symptoms improving. Completed most of antibiotic course and staying hydrated.', '2026-03-15T11:20:00.000Z', '2026-03-15T11:20:00.000Z'),
('note-noah-1', 'patient-noah-kim', 'Follow-up for mood symptoms. Sleeping better and tolerating medication well.', '2026-03-12T17:05:00.000Z', '2026-03-12T17:05:00.000Z'),
('note-priya-1', 'patient-priya-shah', 'Discussed home glucose monitoring and daily walking plan.', '2026-03-13T08:10:00.000Z', '2026-03-13T08:10:00.000Z'),
('note-priya-2', 'patient-priya-shah', 'Blood pressure trend reviewed. Continue current regimen and recheck in one month.', '2026-03-20T08:35:00.000Z', '2026-03-20T08:35:00.000Z');

INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt) VALUES
('event-emma-created', 'patient-emma-carter', 'PATIENT_CREATED', 'Patient created', 'Created seeded local testing patient record.', '2026-03-02T09:00:00.000Z'),
('event-emma-rx-created', 'patient-emma-carter', 'PRESCRIPTION_CREATED', 'Prescription added', 'Amoxicillin 500 mg added.', '2026-03-10T09:30:00.000Z'),
('event-emma-note', 'patient-emma-carter', 'NOTE_CREATED', 'Note added', 'Patient reports sore throat for three days with mild fever at home.', '2026-03-10T09:00:00.000Z'),
('event-emma-rx-inactive', 'patient-emma-carter', 'PRESCRIPTION_INACTIVATED', 'Prescription inactivated', 'Ibuprofen marked inactive.', '2026-03-16T14:00:00.000Z'),
('event-noah-created', 'patient-noah-kim', 'PATIENT_CREATED', 'Patient created', 'Created seeded local testing patient record.', '2026-03-03T11:15:00.000Z'),
('event-noah-rx-created', 'patient-noah-kim', 'PRESCRIPTION_CREATED', 'Prescription added', 'Sertraline 50 mg added.', '2026-03-08T10:00:00.000Z'),
('event-noah-note', 'patient-noah-kim', 'NOTE_CREATED', 'Note added', 'Follow-up for mood symptoms. Sleeping better and tolerating medication well.', '2026-03-12T17:05:00.000Z'),
('event-priya-created', 'patient-priya-shah', 'PATIENT_CREATED', 'Patient created', 'Created seeded local testing patient record.', '2026-03-04T12:30:00.000Z'),
('event-priya-rx-metformin', 'patient-priya-shah', 'PRESCRIPTION_CREATED', 'Prescription added', 'Metformin 500 mg added.', '2026-03-09T08:45:00.000Z'),
('event-priya-rx-lisinopril', 'patient-priya-shah', 'PRESCRIPTION_CREATED', 'Prescription added', 'Lisinopril 10 mg added.', '2026-03-11T16:10:00.000Z'),
('event-priya-note-1', 'patient-priya-shah', 'NOTE_CREATED', 'Note added', 'Discussed home glucose monitoring and daily walking plan.', '2026-03-13T08:10:00.000Z'),
('event-priya-note-2', 'patient-priya-shah', 'NOTE_CREATED', 'Note added', 'Blood pressure trend reviewed. Continue current regimen and recheck in one month.', '2026-03-20T08:35:00.000Z');
