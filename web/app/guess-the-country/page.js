import GuessCountryGameClientOnly from "../../components/GuessCountryGameClientOnly";

export const metadata = {
  title: "Globeing — Guess the Country",
  description: "Ten country silhouettes, five lives each — guess the country letter by letter.",
};

export default function GuessTheCountryPage() {
  return <GuessCountryGameClientOnly />;
}
