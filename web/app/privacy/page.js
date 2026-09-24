import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Globeing collects and uses data: Google Analytics, cookies, emails you send us, and the third-party services we work with.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Privacy Policy</h1>
        <p className="app-hero__subtitle">Last updated: September 25, 2026</p>
      </div>

      <article className="legal">
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            <strong>Usage data (automatic).</strong> Like most websites, we use Google Analytics to
            understand how visitors use the site — pages viewed, time on site, general location
            (country/city level), device and browser type. This data is aggregated and does not
            identify you personally.
          </p>
          <p>
            <strong>Cookies.</strong> We use cookies for analytics, and — once display advertising is
            active — for ad personalization and measurement served through Google AdSense. See the
            &ldquo;Cookies&rdquo; section below for details and how to manage your preferences.
          </p>
          <p>
            <strong>Emails you send us.</strong> Our contact page opens your own email app — nothing
            is stored on our servers. If you email us, we receive your name, email address, and
            message, and use them solely to respond to your inquiry. We do not use this information
            for marketing.
          </p>
          <p>
            <strong>No user accounts.</strong> Globeing does not require registration or accounts. We
            do not collect passwords, payment information, or other account-level personal data.
          </p>
        </section>

        <section>
          <h2>2. How We Use Information</h2>
          <p>We use the information above to:</p>
          <ul>
            <li>Understand and improve how people use the site</li>
            <li>Respond to inquiries you send us by email</li>
            <li>Once active, serve and measure relevant advertising through Google AdSense</li>
            <li>Diagnose technical issues</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies</h2>
          <p>We use the following categories of cookies:</p>
          <ul>
            <li>
              <strong>Essential cookies</strong> — required for the site to function correctly.
            </li>
            <li>
              <strong>Analytics cookies (Google Analytics)</strong> — help us understand aggregate
              site usage.
            </li>
            <li>
              <strong>Advertising cookies (Google AdSense, once active)</strong> — Google, as a
              third-party vendor, uses cookies to serve ads based on your prior visits to this and
              other websites. You can opt out of personalized advertising by visiting{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
                Google&apos;s Ads Settings
              </a>
              .
            </li>
          </ul>
          <p>
            You can manage or withdraw your cookie consent at any time using the cookie preference
            tool available on this site.
          </p>
          {/* CookieYes reopens its preference centre on any element with this class. */}
          <button type="button" className="legal__cookie-button cky-banner-element">
            Manage cookie preferences
          </button>
        </section>

        <section>
          <h2>4. Third Parties We Work With</h2>
          <ul>
            <li>
              <strong>Google Analytics</strong> — usage analytics
            </li>
            <li>
              <strong>Google AdSense (once active)</strong> — advertising
            </li>
            <li>
              <strong>Supabase</strong> — our database backend, used to store and serve country data,
              facts, and game content (no personal user data is stored here)
            </li>
            <li>
              <strong>Vercel</strong> — website hosting
            </li>
          </ul>
          <p>
            These providers may process data outside your country of residence, including in the
            United States, under their own privacy and security safeguards.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain emails you send us only as long as needed to address your inquiry.
            Analytics data is retained according to Google Analytics&apos; default retention settings.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Depending on where you live, you may have the right to access, correct, or request
            deletion of your personal data, or to object to certain processing (for example, under
            the GDPR if you&apos;re in the EU/EEA/UK, or the CCPA if you&apos;re a California
            resident). To exercise any of these rights, contact us at{" "}
            <a href="mailto:gabyro23@gmail.com">gabyro23@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Globeing is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal
            information, please contact us and we will delete it.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href="mailto:gabyro23@gmail.com">gabyro23@gmail.com</a> or use our{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </section>
      </article>
    </>
  );
}
