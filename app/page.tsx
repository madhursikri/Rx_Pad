import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <section className="hero-card hero-split">
      <div>
        <p className="hero-kicker">Local-First Practice App</p>
        <h1 className="hero-title">Modern patient management for faster consultations</h1>
        <p className="hero-subtitle">
          Clean workflows, instant lookup, and dependable local storage designed for daily clinical use.
        </p>

        <div className="pill-row">
          <span className="pill">Instant Search</span>
          <span className="pill">Local Database</span>
          <span className="pill">One-Command Startup</span>
        </div>

        <div className="grid-2">
          <Link href="/patients/new" className="action-card">
            <h2 className="action-title">Add New Patient</h2>
            <p className="action-desc">Capture demographics, contact info, and clinical notes in one form.</p>
          </Link>

          <Link href="/patients" className="action-card">
            <h2 className="action-title">Search Patients</h2>
            <p className="action-desc">Find records fast by name, date of birth, or phone number.</p>
          </Link>
        </div>
      </div>

      <div className="hero-image-wrap">
        <Image
          src="/images/medical-hero.svg"
          alt="Medical dashboard illustration"
          className="hero-image"
          width={680}
          height={520}
          priority
        />
      </div>
    </section>
  );
}
