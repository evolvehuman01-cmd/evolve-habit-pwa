// ── EVOLVE:HUMAN PRIVACY POLICY ──────────────────────────
// Served at /privacy-policy via main.jsx pathname routing

const C = {
  orange: '#F26419',
  navy:   '#1C2B3A',
  cream:  '#F0EEF5',
  white:  '#FFFFFF',
}

const PRIDE = ['#E03131', '#F26419', '#F5C800', '#2E7D32', '#1565C0', '#6A1B9A']

function PrideBand({ height = 7 }) {
  return (
    <div style={{ display: 'flex', width: '100%', height }}>
      {PRIDE.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: C.cream, color: C.navy, fontFamily: "'Barlow', sans-serif" }}>
      <PrideBand height={8} />

      {/* Header */}
      <div style={{ background: C.navy, padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="https://www.evolvehuman.co.uk" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: '0.08em', color: C.white }}>
              EVOLVE<span style={{ color: C.orange }}>:</span>HUMAN
            </div>
          </a>
          <a href="https://www.evolvehuman.co.uk" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
            ← Back to site
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 48, textTransform: 'uppercase', letterSpacing: '0.01em', color: C.navy, lineHeight: 1, marginBottom: 8 }}>
          Privacy Policy
        </div>
        <div style={{ fontSize: 14, color: 'rgba(28,43,58,0.45)', marginBottom: 48, fontStyle: 'italic' }}>
          Last updated: June 2026
        </div>

        <Section title="Who we are">
          <p>Evolve:Human is a health and fitness coaching business operated by Kath Stephens, providing personal training, online training programmes, lifestyle coaching, and nutrition coaching.</p>
          <p>Contact: <a href="mailto:evolve.human01@gmail.com" style={{ color: C.orange }}>evolve.human01@gmail.com</a><br />
          Website: <a href="https://www.evolvehuman.co.uk" style={{ color: C.orange }}>www.evolvehuman.co.uk</a></p>
        </Section>

        <Section title="What data we collect and why">
          <p>When you complete our initial wellbeing consultation, we collect the following information:</p>
          <ul>
            <li><strong>Personal details</strong> — your name, email address, and phone number, used to communicate with you and administer your coaching programme</li>
            <li><strong>Health and lifestyle information</strong> — including sleep, stress, energy, nutrition, hydration, and activity data, used to build your personalised programme</li>
            <li><strong>Medical information</strong> — including any medical conditions and current medications you choose to disclose, used solely to ensure your programme is appropriate and safe for you</li>
            <li><strong>Goal and motivation data</strong> — your stated goals, challenges, and coaching preferences, used to tailor your programme to you</li>
          </ul>
          <p>We do not collect this data for marketing purposes. We do not sell it. We do not share it with third parties.</p>
        </Section>

        <Section title="Special category data">
          <p>Health and medical information is classified as special category data under UK GDPR. We collect it only with your explicit consent, which you provide when you tick the consent box on our consultation form. You may withdraw consent at any time by contacting us at <a href="mailto:evolve.human01@gmail.com" style={{ color: C.orange }}>evolve.human01@gmail.com</a> — upon withdrawal, we will delete your data within 30 days.</p>
        </Section>

        <Section title="How your data is stored">
          <p>Your data is stored securely in Google Workspace (Google Sheets), protected by Google's security infrastructure. Access is restricted to your coach only. Your data is never stored on a third-party marketing platform, CRM, or shared system.</p>
        </Section>

        <Section title="How long we keep your data">
          <p>We retain your data for the duration of your coaching programme and for up to 12 months after your programme ends. After this period your data is deleted. You may request earlier deletion at any time.</p>
        </Section>

        <Section title="Your rights under UK GDPR">
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noreferrer" style={{ color: C.orange }}>ico.org.uk</a></li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:evolve.human01@gmail.com" style={{ color: C.orange }}>evolve.human01@gmail.com</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="Cookies and website analytics">
          <p>Our website is built on Wix, which may use cookies for basic site functionality and analytics. We do not run advertising cookies or tracking pixels. For information on Wix's data practices, see <a href="https://www.wix.com/about/privacy" target="_blank" rel="noreferrer" style={{ color: C.orange }}>wix.com/about/privacy</a>.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>We may update this policy from time to time. The date at the top of this page reflects the most recent version. Continued use of our services after any update constitutes acceptance of the revised policy.</p>
        </Section>

        <Section title="Contact">
          <p>For any privacy-related questions: <a href="mailto:evolve.human01@gmail.com" style={{ color: C.orange }}>evolve.human01@gmail.com</a></p>
        </Section>

      </div>

      <PrideBand height={8} />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.orange, marginBottom: 8 }}>
        Evolve:Human · Privacy
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: C.navy, marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(28,43,58,0.8)' }}>
        {children}
      </div>
      <div style={{ height: 1, background: 'rgba(28,43,58,0.08)', marginTop: 40 }} />
    </div>
  )
}
