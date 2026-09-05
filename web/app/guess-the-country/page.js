import GuessCountryGameClientOnly from "../../components/GuessCountryGameClientOnly";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Guess the Country",
  description: "Guess the country from its silhouette, letter by letter, with five lives — ten countries per round.",
  path: "/guess-the-country",
});

export default function GuessTheCountryPage() {
  return <GuessCountryGameClientOnly />;
}
