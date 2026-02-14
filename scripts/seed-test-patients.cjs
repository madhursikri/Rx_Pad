const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function toUtcDate(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function fullPhoneDigits(countryCode, phone) {
  if (!countryCode || !phone) return null;
  return `${normalizeDigits(countryCode)}${normalizeDigits(phone)}`;
}

const TEST_PATIENTS = [
  {
    firstName: "Emma",
    lastName: "Carter",
    dob: "1988-04-12",
    gender: "female",
    phoneCountryCode: "+1",
    phone: "4155550188",
    email: "emma.carter@example.test",
    addressLine1: "145 Lakeview Ave",
    city: "San Francisco",
    state: "CA",
    postalCode: "94107",
    notes: "Test patient with full demographics."
  },
  {
    firstName: "Arjun",
    lastName: "Patel",
    dob: "1979-11-03",
    gender: "male",
    phoneCountryCode: "+91",
    phone: "9876543210",
    email: "arjun.patel@example.test",
    city: "Ahmedabad",
    state: "GJ",
    notes: "Test patient with international number."
  },
  {
    firstName: "Mia",
    lastName: "Lopez",
    dob: "2001-09-25",
    gender: "female",
    phoneCountryCode: "+1",
    phone: "2125550110",
    addressLine1: "21 Orchard St",
    city: "New York",
    state: "NY",
    postalCode: "10002"
  },
  {
    firstName: "Noah",
    lastName: "Kim",
    dob: "1995-06-14",
    gender: "male",
    email: "noah.kim@example.test",
    notes: "No phone provided."
  },
  {
    firstName: "Ava",
    lastName: "Nguyen",
    dob: "2010-01-08",
    gender: "other",
    phoneCountryCode: "+1",
    phone: "5035550162",
    addressLine1: "88 Pine Road",
    city: "Portland",
    state: "OR"
  },
  {
    firstName: "Luca",
    lastName: "Rossi",
    dob: "1967-12-19",
    gender: "male",
    phoneCountryCode: "+39",
    phone: "3312345678",
    email: "luca.rossi@example.test",
    notes: "Long-term test history profile."
  },
  {
    firstName: "Sofia",
    lastName: "Hernandez",
    dob: "1983-03-30",
    gender: "female",
    phoneCountryCode: "+34",
    phone: "611223344",
    addressLine1: "Calle Mayor 18",
    city: "Madrid",
    postalCode: "28013"
  },
  {
    firstName: "Ethan",
    lastName: "Brooks",
    dob: "1992-07-21",
    gender: "prefer_not_to_say",
    phoneCountryCode: "+1",
    phone: "6465550174",
    email: "ethan.brooks@example.test"
  },
  {
    firstName: "Priya",
    lastName: "Shah",
    dob: "1974-05-06",
    gender: "female",
    phoneCountryCode: "+971",
    phone: "501234567",
    addressLine1: "24 Palm Residence",
    city: "Dubai",
    notes: "Test patient with notes only address partial."
  },
  {
    firstName: "Daniel",
    lastName: "Miller",
    dob: "1958-02-01",
    gender: "male",
    phoneCountryCode: "+44",
    phone: "7700900123",
    email: "daniel.miller@example.test",
    addressLine1: "9 Baker Street",
    city: "London",
    postalCode: "NW1 6XE"
  }
];

const MEDICATIONS = [
  {
    name: "Amoxicillin",
    commonStrengths: "250 mg, 500 mg",
    defaultDose: "1 capsule",
    defaultFrequency: "Three times daily",
    defaultDuration: "7 days",
    defaultInstructions: "Take after food"
  },
  {
    name: "Azithromycin",
    commonStrengths: "250 mg, 500 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "3 days",
    defaultInstructions: "Take with water"
  },
  {
    name: "Metformin",
    commonStrengths: "500 mg, 850 mg, 1000 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Twice daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take with meals"
  },
  {
    name: "Lisinopril",
    commonStrengths: "5 mg, 10 mg, 20 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Check blood pressure regularly"
  },
  {
    name: "Amlodipine",
    commonStrengths: "2.5 mg, 5 mg, 10 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take at the same time each day"
  },
  {
    name: "Atorvastatin",
    commonStrengths: "10 mg, 20 mg, 40 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once nightly",
    defaultDuration: "30 days",
    defaultInstructions: "Avoid grapefruit juice"
  },
  {
    name: "Levothyroxine",
    commonStrengths: "25 mcg, 50 mcg, 100 mcg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take on empty stomach in the morning"
  },
  {
    name: "Omeprazole",
    commonStrengths: "20 mg, 40 mg",
    defaultDose: "1 capsule",
    defaultFrequency: "Once daily",
    defaultDuration: "14 days",
    defaultInstructions: "Take before breakfast"
  },
  {
    name: "Ibuprofen",
    commonStrengths: "200 mg, 400 mg, 600 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Every 8 hours as needed",
    defaultDuration: "5 days",
    defaultInstructions: "Take with food"
  },
  {
    name: "Acetaminophen",
    commonStrengths: "325 mg, 500 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Every 6 hours as needed",
    defaultDuration: "5 days",
    defaultInstructions: "Do not exceed max daily dose"
  },
  {
    name: "Losartan",
    commonStrengths: "25 mg, 50 mg, 100 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Monitor blood pressure"
  },
  {
    name: "Hydrochlorothiazide",
    commonStrengths: "12.5 mg, 25 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take in the morning"
  },
  {
    name: "Albuterol Inhaler",
    commonStrengths: "90 mcg/actuation",
    defaultDose: "2 puffs",
    defaultFrequency: "Every 4-6 hours as needed",
    defaultDuration: "30 days",
    defaultInstructions: "Use spacer if available"
  },
  {
    name: "Sertraline",
    commonStrengths: "25 mg, 50 mg, 100 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "30 days",
    defaultInstructions: "Take at same time daily"
  },
  {
    name: "Prednisone",
    commonStrengths: "5 mg, 10 mg, 20 mg",
    defaultDose: "1 tablet",
    defaultFrequency: "Once daily",
    defaultDuration: "5 days",
    defaultInstructions: "Take with food"
  }
];

async function ensurePatient(patient) {
  const existing = await prisma.patient.findFirst({
    where: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: toUtcDate(patient.dob)
    },
    select: { id: true }
  });

  if (existing) return false;

  const phoneDigits = patient.phone ? normalizeDigits(patient.phone) : null;
  const countryCode = patient.phoneCountryCode || null;

  await prisma.patient.create({
    data: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: toUtcDate(patient.dob),
      gender: patient.gender,
      phoneCountryCode: countryCode,
      phone: phoneDigits,
      phoneE164: fullPhoneDigits(countryCode, phoneDigits),
      email: patient.email || null,
      addressLine1: patient.addressLine1 || null,
      addressLine2: patient.addressLine2 || null,
      city: patient.city || null,
      state: patient.state || null,
      postalCode: patient.postalCode || null,
      notes: patient.notes || null
    }
  });

  return true;
}

async function ensureMedication(medication) {
  const existing = await prisma.medication.findUnique({
    where: { name: medication.name },
    select: { id: true }
  });
  if (existing) {
    await prisma.medication.update({
      where: { id: existing.id },
      data: {
        commonStrengths: medication.commonStrengths,
        defaultDose: medication.defaultDose ?? null,
        defaultFrequency: medication.defaultFrequency ?? null,
        defaultDuration: medication.defaultDuration ?? null,
        defaultInstructions: medication.defaultInstructions ?? null
      }
    });
    return false;
  }

  await prisma.medication.create({
    data: {
      name: medication.name,
      commonStrengths: medication.commonStrengths,
      defaultDose: medication.defaultDose ?? null,
      defaultFrequency: medication.defaultFrequency ?? null,
      defaultDuration: medication.defaultDuration ?? null,
      defaultInstructions: medication.defaultInstructions ?? null
    }
  });
  return true;
}

async function main() {
  let medicationInserted = 0;
  for (const medication of MEDICATIONS) {
    const wasInserted = await ensureMedication(medication);
    if (wasInserted) medicationInserted += 1;
  }

  let inserted = 0;
  for (const patient of TEST_PATIENTS) {
    const wasInserted = await ensurePatient(patient);
    if (wasInserted) inserted += 1;
  }
  console.log(`[SEED] Added ${medicationInserted} new medication(s).`);
  console.log(`[SEED] Added ${inserted} new test patient(s).`);
}

main()
  .catch((error) => {
    console.error("[SEED] Failed to seed test patients:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
