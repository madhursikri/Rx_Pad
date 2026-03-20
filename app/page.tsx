import Link from "next/link";

const helpTopics = [
  {
    title: "Add a patient",
    summary: "Use this workflow when a new patient arrives or you need to register someone for the first time.",
    steps: [
      "Open Add Patient.",
      "Fill in the required fields: first name, last name, date of birth, and gender.",
      "Add phone, email, address, or notes if you have them.",
      "Save the patient record."
    ]
  },
  {
    title: "Search patients",
    summary: "Use this workflow when you need to find an existing patient quickly.",
    steps: [
      "Open Search Patients.",
      "Type a name, date of birth, or phone digits.",
      "Select the matching record from the results.",
      "Review the patient overview."
    ]
  },
  {
    title: "Review patient details",
    summary: "Use this when you want to see the chart for one patient in a focused view.",
    steps: [
      "Open a patient from search results.",
      "Read the demographics and contact details.",
      "Look at current prescriptions and older prescriptions.",
      "Check the patient note history."
    ]
  },
  {
    title: "Add a prescription",
    summary: "Use this workflow when you want to attach a new prescription to a selected patient.",
    steps: [
      "Select a patient first.",
      "Choose a medication from the search list.",
      "Confirm strength, dose, frequency, duration, and instructions.",
      "Save the prescription."
    ]
  },
  {
    title: "Add a note",
    summary: "Use this when you want to record a visit note or clinical reminder.",
    steps: [
      "Select a patient first.",
      "Open the note composer.",
      "Write the note and save it.",
      "The note is stored with a timestamp."
    ]
  },
  {
    title: "Manage medication presets",
    summary: "Use this when you want to maintain common medication templates for faster prescribing.",
    steps: [
      "Open Prescription Dataset.",
      "Search for an existing medication or add a new one.",
      "Set the default dose, frequency, duration, and instructions.",
      "Edit or delete entries as the clinic workflow changes."
    ]
  }
];

export default function HomePage() {
  return (
    <section className="stack-lg">
      <article className="hero-card landing-hero landing-hero-minimal">
        <div className="landing-copy">
          <p className="hero-kicker">Rx Pad</p>
          <h1 className="hero-title">Simple patient intake, search, prescriptions, and notes.</h1>
          <p className="hero-subtitle">
            This app is for a small clinic workflow. Use the Help section below to learn the task you want to do.
          </p>

          <div className="cta-row">
            <Link href="/patients/new" className="btn">
              Add New Patient
            </Link>
            <Link href="/patients" className="btn btn-soft">
              Search Patients
            </Link>
            <Link href="/prescription-dataset" className="btn btn-soft">
              Prescription Dataset
            </Link>
          </div>
        </div>
      </article>

      <section className="panel">
        <div className="panel-header">
          <h2 className="section-title">Help</h2>
          <span className="section-chip">Choose a workflow</span>
        </div>
        <p className="landing-intro">
          Pick the task you want to learn about. Each section below explains one workflow in plain language.
        </p>

        <div className="help-grid">
          {helpTopics.map((topic) => (
            <details key={topic.title} className="help-card">
              <summary>
                <span>{topic.title}</span>
                <small>{topic.summary}</small>
              </summary>
              <ol>
                {topic.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}
