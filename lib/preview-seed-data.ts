export const PREVIEW_BOOTSTRAP_KEY = "preview-sample-data-v1";

export const PREVIEW_MEDICATIONS = [
  {
    id: "med-amoxicillin",
    name: "Amoxicillin",
    commonStrengths: "250 mg, 500 mg",
    defaultDose: "1 capsule",
    defaultFrequency: "Three times daily",
    defaultDuration: "7 days",
    defaultInstructions: "Take after food",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z"
  },
  {
    id: "med-metformin",
    name: "Metformin",
    commonStrengths: "500 mg, 850 mg, 1000 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Twice daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take with meals",
    createdAt: "2026-03-01T08:05:00.000Z",
    updatedAt: "2026-03-01T08:05:00.000Z"
  },
  {
    id: "med-lisinopril",
    name: "Lisinopril",
    commonStrengths: "5 mg, 10 mg, 20 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Check blood pressure regularly",
    createdAt: "2026-03-01T08:10:00.000Z",
    updatedAt: "2026-03-01T08:10:00.000Z"
  },
  {
    id: "med-ibuprofen",
    name: "Ibuprofen",
    commonStrengths: "200 mg, 400 mg, 600 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Every 8 hours as needed",
    defaultDuration: "5 days",
    defaultInstructions: "Take with food",
    createdAt: "2026-03-01T08:15:00.000Z",
    updatedAt: "2026-03-01T08:15:00.000Z"
  },
  {
    id: "med-albuterol",
    name: "Albuterol Inhaler",
    commonStrengths: "90 mcg/actuation",
    defaultDose: "2 puffs",
    defaultFrequency: "Every 4-6 hours as needed",
    defaultDuration: "30 days",
    defaultInstructions: "Use spacer if available",
    createdAt: "2026-03-01T08:20:00.000Z",
    updatedAt: "2026-03-01T08:20:00.000Z"
  },
  {
    id: "med-sertraline",
    name: "Sertraline",
    commonStrengths: "25 mg, 50 mg, 100 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take at same time daily",
    createdAt: "2026-03-01T08:25:00.000Z",
    updatedAt: "2026-03-01T08:25:00.000Z"
  }
] as const;

export const PREVIEW_PATIENTS = [
  {
    id: "patient-emma-carter",
    firstName: "Emma",
    lastName: "Carter",
    dob: "1988-04-12T00:00:00.000Z",
    gender: "female",
    phoneCountryCode: "+1",
    phone: "4155550188",
    phoneE164: "14155550188",
    email: "emma.carter@example.test",
    addressLine1: "145 Lakeview Ave",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    postalCode: "94107",
    notes: "Test patient with active and inactive prescriptions.",
    createdAt: "2026-03-02T09:00:00.000Z",
    updatedAt: "2026-03-18T10:45:00.000Z"
  },
  {
    id: "patient-noah-kim",
    firstName: "Noah",
    lastName: "Kim",
    dob: "1995-06-14T00:00:00.000Z",
    gender: "male",
    phoneCountryCode: null,
    phone: null,
    phoneE164: null,
    email: "noah.kim@example.test",
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    notes: "No phone provided. Good record for note and timeline testing.",
    createdAt: "2026-03-03T11:15:00.000Z",
    updatedAt: "2026-03-19T15:20:00.000Z"
  },
  {
    id: "patient-priya-shah",
    firstName: "Priya",
    lastName: "Shah",
    dob: "1974-05-06T00:00:00.000Z",
    gender: "female",
    phoneCountryCode: "+971",
    phone: "501234567",
    phoneE164: "971501234567",
    email: null,
    addressLine1: "24 Palm Residence",
    addressLine2: null,
    city: "Dubai",
    state: null,
    postalCode: null,
    notes: "Useful for international phone and chronic medication examples.",
    createdAt: "2026-03-04T12:30:00.000Z",
    updatedAt: "2026-03-20T08:35:00.000Z"
  }
] as const;

export const PREVIEW_PRESCRIPTIONS = [
  {
    id: "rx-emma-amoxicillin",
    patientId: "patient-emma-carter",
    medicationId: "med-amoxicillin",
    medicationName: "Amoxicillin",
    strength: "500 mg",
    dose: "1 capsule",
    frequency: "Three times daily",
    duration: "7 days",
    instructions: "Finish the full course.",
    isActive: 1,
    inactivatedAt: null,
    createdAt: "2026-03-10T09:30:00.000Z",
    updatedAt: "2026-03-10T09:30:00.000Z"
  },
  {
    id: "rx-emma-ibuprofen",
    patientId: "patient-emma-carter",
    medicationId: "med-ibuprofen",
    medicationName: "Ibuprofen",
    strength: "400 mg",
    dose: "1 tablet",
    frequency: "Every 8 hours as needed",
    duration: "5 days",
    instructions: "Take with food for throat pain.",
    isActive: 0,
    inactivatedAt: "2026-03-16T14:00:00.000Z",
    createdAt: "2026-03-12T13:15:00.000Z",
    updatedAt: "2026-03-16T14:00:00.000Z"
  },
  {
    id: "rx-noah-sertraline",
    patientId: "patient-noah-kim",
    medicationId: "med-sertraline",
    medicationName: "Sertraline",
    strength: "50 mg",
    dose: "1 tablet",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "Take in the morning.",
    isActive: 1,
    inactivatedAt: null,
    createdAt: "2026-03-08T10:00:00.000Z",
    updatedAt: "2026-03-08T10:00:00.000Z"
  },
  {
    id: "rx-priya-metformin",
    patientId: "patient-priya-shah",
    medicationId: "med-metformin",
    medicationName: "Metformin",
    strength: "500 mg",
    dose: "1 tablet",
    frequency: "Twice daily",
    duration: "30 days",
    instructions: "Take with breakfast and dinner.",
    isActive: 1,
    inactivatedAt: null,
    createdAt: "2026-03-09T08:45:00.000Z",
    updatedAt: "2026-03-09T08:45:00.000Z"
  },
  {
    id: "rx-priya-lisinopril",
    patientId: "patient-priya-shah",
    medicationId: "med-lisinopril",
    medicationName: "Lisinopril",
    strength: "10 mg",
    dose: "1 tablet",
    frequency: "Once daily",
    duration: "30 days",
    instructions: "Monitor dizziness during the first week.",
    isActive: 1,
    inactivatedAt: null,
    createdAt: "2026-03-11T16:10:00.000Z",
    updatedAt: "2026-03-11T16:10:00.000Z"
  }
] as const;

export const PREVIEW_NOTES = [
  {
    id: "note-emma-1",
    patientId: "patient-emma-carter",
    note: "Patient reports sore throat for three days with mild fever at home.",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z"
  },
  {
    id: "note-emma-2",
    patientId: "patient-emma-carter",
    note: "Symptoms improving. Completed most of antibiotic course and staying hydrated.",
    createdAt: "2026-03-15T11:20:00.000Z",
    updatedAt: "2026-03-15T11:20:00.000Z"
  },
  {
    id: "note-noah-1",
    patientId: "patient-noah-kim",
    note: "Follow-up for mood symptoms. Sleeping better and tolerating medication well.",
    createdAt: "2026-03-12T17:05:00.000Z",
    updatedAt: "2026-03-12T17:05:00.000Z"
  },
  {
    id: "note-priya-1",
    patientId: "patient-priya-shah",
    note: "Discussed home glucose monitoring and daily walking plan.",
    createdAt: "2026-03-13T08:10:00.000Z",
    updatedAt: "2026-03-13T08:10:00.000Z"
  },
  {
    id: "note-priya-2",
    patientId: "patient-priya-shah",
    note: "Blood pressure trend reviewed. Continue current regimen and recheck in one month.",
    createdAt: "2026-03-20T08:35:00.000Z",
    updatedAt: "2026-03-20T08:35:00.000Z"
  }
] as const;

export const PREVIEW_EVENTS = [
  {
    id: "event-emma-created",
    patientId: "patient-emma-carter",
    type: "PATIENT_CREATED",
    title: "Patient created",
    details: "Created seeded local testing patient record.",
    createdAt: "2026-03-02T09:00:00.000Z"
  },
  {
    id: "event-emma-rx-created",
    patientId: "patient-emma-carter",
    type: "PRESCRIPTION_CREATED",
    title: "Prescription added",
    details: "Amoxicillin 500 mg added.",
    createdAt: "2026-03-10T09:30:00.000Z"
  },
  {
    id: "event-emma-note",
    patientId: "patient-emma-carter",
    type: "NOTE_CREATED",
    title: "Note added",
    details: "Patient reports sore throat for three days with mild fever at home.",
    createdAt: "2026-03-10T09:00:00.000Z"
  },
  {
    id: "event-emma-rx-inactive",
    patientId: "patient-emma-carter",
    type: "PRESCRIPTION_INACTIVATED",
    title: "Prescription inactivated",
    details: "Ibuprofen marked inactive.",
    createdAt: "2026-03-16T14:00:00.000Z"
  },
  {
    id: "event-noah-created",
    patientId: "patient-noah-kim",
    type: "PATIENT_CREATED",
    title: "Patient created",
    details: "Created seeded local testing patient record.",
    createdAt: "2026-03-03T11:15:00.000Z"
  },
  {
    id: "event-noah-rx-created",
    patientId: "patient-noah-kim",
    type: "PRESCRIPTION_CREATED",
    title: "Prescription added",
    details: "Sertraline 50 mg added.",
    createdAt: "2026-03-08T10:00:00.000Z"
  },
  {
    id: "event-noah-note",
    patientId: "patient-noah-kim",
    type: "NOTE_CREATED",
    title: "Note added",
    details: "Follow-up for mood symptoms. Sleeping better and tolerating medication well.",
    createdAt: "2026-03-12T17:05:00.000Z"
  },
  {
    id: "event-priya-created",
    patientId: "patient-priya-shah",
    type: "PATIENT_CREATED",
    title: "Patient created",
    details: "Created seeded local testing patient record.",
    createdAt: "2026-03-04T12:30:00.000Z"
  },
  {
    id: "event-priya-rx-metformin",
    patientId: "patient-priya-shah",
    type: "PRESCRIPTION_CREATED",
    title: "Prescription added",
    details: "Metformin 500 mg added.",
    createdAt: "2026-03-09T08:45:00.000Z"
  },
  {
    id: "event-priya-rx-lisinopril",
    patientId: "patient-priya-shah",
    type: "PRESCRIPTION_CREATED",
    title: "Prescription added",
    details: "Lisinopril 10 mg added.",
    createdAt: "2026-03-11T16:10:00.000Z"
  },
  {
    id: "event-priya-note-1",
    patientId: "patient-priya-shah",
    type: "NOTE_CREATED",
    title: "Note added",
    details: "Discussed home glucose monitoring and daily walking plan.",
    createdAt: "2026-03-13T08:10:00.000Z"
  },
  {
    id: "event-priya-note-2",
    patientId: "patient-priya-shah",
    type: "NOTE_CREATED",
    title: "Note added",
    details: "Blood pressure trend reviewed. Continue current regimen and recheck in one month.",
    createdAt: "2026-03-20T08:35:00.000Z"
  }
] as const;
