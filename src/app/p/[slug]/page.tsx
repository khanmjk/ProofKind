import { CalendarCheck, MapPin, MessageSquareText, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { FitAdvisor } from "@/components/FitAdvisor";
import { PublicProfileRepository } from "@/lib/repositories/publicProfileRepository";

type PublicProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;
  const profile = await new PublicProfileRepository().getPublishedProfile(slug);

  if (!profile) {
    notFound();
  }

  const hasBooking = profile.bookingUrl.length > 0;
  const hasInterest = profile.interestCaptureUrl.length > 0;

  return (
    <main className="page">
      <div className="top-band">
        <div className="shell">
          <nav className="nav" aria-label="Profile actions">
            <div className="brand">
              <span className="brand-mark">PK</span>
              <span>ProofKind</span>
            </div>
            <div className="nav-actions">
              {hasInterest ? (
                <a className="button" href={profile.interestCaptureUrl}>
                  <MessageSquareText size={16} aria-hidden="true" />
                  I want one too
                </a>
              ) : (
                <button className="button" type="button" disabled>
                  <MessageSquareText size={16} aria-hidden="true" />
                  I want one too
                </button>
              )}
              {hasBooking ? (
                <a className="button primary" href={profile.bookingUrl}>
                  <CalendarCheck size={16} aria-hidden="true" />
                  Book a conversation
                </a>
              ) : (
                <button className="button primary" type="button" disabled>
                  <CalendarCheck size={16} aria-hidden="true" />
                  Book a conversation
                </button>
              )}
            </div>
          </nav>
          <section className="hero">
            <div>
              <p className="eyebrow">Public proof profile with profile assistant</p>
              <h1>{profile.displayName}</h1>
              <p className="headline">{profile.headline}</p>
              <p className="headline">{profile.summary}</p>
              <div className="meta-row">
                <span className="pill">
                  <MapPin size={15} aria-hidden="true" />
                  {profile.locationLabel}
                </span>
                <span className="pill">
                  <ShieldCheck size={15} aria-hidden="true" />
                  {profile.availabilityLabel}
                </span>
              </div>
            </div>
            <FitAdvisor slug={profile.slug} />
          </section>
        </div>
      </div>

      <section className="section-band">
        <div className="shell">
          <div className="section-heading">
            <h2>Public Signal</h2>
            <p>
              A concise view of the work patterns, judgement, and operating strengths
              this profile is willing to stand behind publicly.
            </p>
          </div>
          <div className="section-grid">
            {profile.sections.map((section) => (
              <article className="section-item" key={section.id}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="shell">
          <div className="section-heading">
            <h2>Proof Claims</h2>
            <p>
              Approved claims the public profile assistant can cite when answering visitor questions.
            </p>
          </div>
          <div className="claims-grid">
            {profile.claims.map((claim) => (
              <article className="claim-card" key={claim.id}>
                <h3>{claim.claimType}</h3>
                <p>{claim.approvedPublicText}</p>
                <div className="claim-tags">
                  {claim.capabilityTags.slice(0, 3).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="shell">
          Public profile answers are informational and limited to approved public profile
          content. They are not hiring recommendations or employment decisions.
        </div>
      </footer>
    </main>
  );
}
