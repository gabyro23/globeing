import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "The terms for using Globeing's country data, comparisons, rankings, facts, and geography games.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero__title">Terms of Use</h1>
        <p className="app-hero__subtitle">Last updated: September 25, 2026</p>
      </div>

      <article className="legal">
        <section>
          <h2>1. About Globeing</h2>
          <p>
            Globeing provides informational tools and games about world countries — including data
            comparisons, rankings, facts, and geography-based games — for general educational and
            entertainment purposes.
          </p>
        </section>

        <section>
          <h2>2. Accuracy of Information</h2>
          <p>
            Country data (population, GDP, and other indicators) is drawn from public sources
            including the World Bank, ILOSTAT, and other datasets credited on our{" "}
            <Link href="/data-sources">Data Sources</Link> page. We make reasonable efforts to keep
            this data accurate and current, but we do not guarantee its completeness or accuracy, and
            it should not be relied upon for official, legal, financial, or academic purposes without
            independent verification.
          </p>
        </section>

        <section>
          <h2>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Use automated tools to scrape or bulk-extract content from the site beyond normal,
              personal browsing
            </li>
            <li>Attempt to disrupt, overload, or interfere with the site&apos;s normal operation</li>
            <li>Use the site for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2>4. Intellectual Property</h2>
          <p>
            The Globeing name, logo, visual design, and original content (including our
            &ldquo;personitas&rdquo; illustrations and pictogram visualizations) are the property of
            Globeing. Underlying factual data is sourced from public/open datasets as credited on our{" "}
            <Link href="/data-sources">Data Sources</Link> page and is not our proprietary content.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Links</h2>
          <p>
            Our site links to external sources (e.g., Wikipedia, World Bank) for further reading. We
            are not responsible for the content, accuracy, or privacy practices of external sites.
          </p>
        </section>

        <section>
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The site and its content are provided &ldquo;as is,&rdquo; without warranties of any
            kind, express or implied. We do not warrant that the site will be uninterrupted,
            error-free, or secure.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Globeing shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the site or reliance on its
            content.
          </p>
        </section>

        <section>
          <h2>8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the site after changes
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2>9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Spain, without regard to conflict-of-law
            principles.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a href="mailto:gabyro23@gmail.com">gabyro23@gmail.com</a>.
          </p>
        </section>
      </article>
    </>
  );
}
