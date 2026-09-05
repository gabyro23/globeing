import CrosswordGame from "../../components/CrosswordGame";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Geopolitics Crosswords",
  description:
    "Five geopolitics crossword boards covering capitals, currencies, international organizations, geography, and world trivia.",
  path: "/crosswords",
});

export default function CrosswordsPage() {
  return <CrosswordGame />;
}
