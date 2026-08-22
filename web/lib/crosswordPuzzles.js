// Crossword board data for the /crosswords page. Each puzzle is a themed
// grid of geopolitics words: capitals, currencies, organizations, physical
// geography, and country trivia. `n` is the clue number shown in the grid
// and clue list; `dir` is "A" (across) or "D" (down); `row`/`col` are the
// 0-indexed position of the word's first letter.
export const CROSSWORD_PUZZLES = [
  {
    title: "World capitals",
    width: 16,
    height: 11,
    words: [
      { n: 6, dir: "A", row: 4, col: 3, answer: "MADRID", clue: "Capital of Spain" },
      { n: 3, dir: "D", row: 2, col: 6, answer: "BERLIN", clue: "Capital of Germany" },
      { n: 4, dir: "D", row: 3, col: 4, answer: "CAIRO", clue: "Capital of Egypt" },
      { n: 2, dir: "D", row: 1, col: 8, answer: "LONDON", clue: "Capital of the United Kingdom" },
      { n: 2, dir: "A", row: 1, col: 8, answer: "LIMA", clue: "Capital of Peru" },
      { n: 1, dir: "D", row: 0, col: 11, answer: "PARIS", clue: "Capital of France" },
      { n: 8, dir: "A", row: 7, col: 0, answer: "TOKYO", clue: "Capital of Japan" },
      { n: 7, dir: "A", row: 4, col: 11, answer: "SEOUL", clue: "Capital of South Korea" },
      { n: 5, dir: "D", row: 3, col: 13, answer: "ROME", clue: "Capital of Italy" },
      { n: 9, dir: "D", row: 7, col: 1, answer: "OSLO", clue: "Capital of Norway" },
    ],
  },
  {
    title: "International organizations",
    width: 15,
    height: 8,
    words: [
      { n: 5, dir: "A", row: 3, col: 6, answer: "MERCOSUR", clue: "South American trade bloc" },
      { n: 2, dir: "D", row: 0, col: 9, answer: "OPEC", clue: "Organization of Petroleum Exporting Countries" },
      { n: 4, dir: "D", row: 2, col: 13, answer: "BRICS", clue: "Bloc of emerging economies (Brazil, Russia, India...)" },
      { n: 3, dir: "D", row: 2, col: 6, answer: "IMF", clue: "International Monetary Fund (abbr.)" },
      { n: 6, dir: "A", row: 4, col: 1, answer: "UNICEF", clue: "UN fund dedicated to children" },
      { n: 8, dir: "A", row: 5, col: 9, answer: "UNESCO", clue: "UN body for education, science and culture" },
      { n: 7, dir: "D", row: 4, col: 2, answer: "NATO", clue: "North Atlantic military alliance (abbr.)" },
      { n: 1, dir: "A", row: 0, col: 7, answer: "WHO", clue: "World Health Organization (abbr.)" },
      { n: 9, dir: "A", row: 6, col: 0, answer: "INTERPOL", clue: "International police cooperation organization" },
      { n: 8, dir: "D", row: 5, col: 9, answer: "UN", clue: "United Nations (abbr.)" },
    ],
  },
  {
    title: "World currencies",
    width: 10,
    height: 13,
    words: [
      { n: 4, dir: "A", row: 5, col: 1, answer: "DOLLAR", clue: "Currency of the United States" },
      { n: 5, dir: "D", row: 5, col: 6, answer: "RUPEE", clue: "Currency of India" },
      { n: 3, dir: "D", row: 2, col: 2, answer: "EURO", clue: "Currency of the European Union" },
      { n: 8, dir: "A", row: 9, col: 2, answer: "RUBLE", clue: "Currency of Russia" },
      { n: 7, dir: "A", row: 7, col: 6, answer: "PESO", clue: "Currency of Mexico and Argentina" },
      { n: 2, dir: "A", row: 2, col: 1, answer: "YEN", clue: "Currency of Japan" },
      { n: 1, dir: "D", row: 0, col: 3, answer: "WON", clue: "Currency of South Korea" },
      { n: 8, dir: "D", row: 9, col: 2, answer: "REAL", clue: "Currency of Brazil" },
      { n: 9, dir: "A", row: 11, col: 0, answer: "YUAN", clue: "Currency of China" },
      { n: 6, dir: "D", row: 6, col: 9, answer: "POUND", clue: "Currency of the United Kingdom" },
    ],
  },
  {
    title: "Political geography",
    width: 12,
    height: 17,
    words: [
      { n: 7, dir: "A", row: 11, col: 0, answer: "HIMALAYAS", clue: "World's highest mountain range" },
      { n: 4, dir: "D", row: 6, col: 5, answer: "PANAMA", clue: "Country with a key interoceanic canal" },
      { n: 6, dir: "D", row: 10, col: 1, answer: "NILE", clue: "Africa's longest river" },
      { n: 5, dir: "A", row: 7, col: 4, answer: "SAHARA", clue: "Africa's largest desert" },
      { n: 2, dir: "D", row: 1, col: 8, answer: "BOSPHORUS", clue: "Strait dividing Istanbul between two continents" },
      { n: 3, dir: "A", row: 3, col: 3, answer: "EVEREST", clue: "World's highest mountain" },
      { n: 8, dir: "D", row: 11, col: 7, answer: "AMAZON", clue: "World's largest river by volume" },
      { n: 1, dir: "D", row: 0, col: 3, answer: "ANDES", clue: "World's longest mountain range" },
      { n: 10, dir: "A", row: 13, col: 3, answer: "GIBRALTAR", clue: "Strait between Europe and Africa" },
      { n: 9, dir: "D", row: 11, col: 10, answer: "URALS", clue: "Mountains dividing Europe and Asia" },
    ],
  },
  {
    title: "Countries & trivia",
    width: 16,
    height: 18,
    words: [
      { n: 3, dir: "A", row: 7, col: 5, answer: "SWITZERLAND", clue: "Neutral European country famous for banking" },
      { n: 2, dir: "D", row: 6, col: 13, answer: "CANADA", clue: "World's second-largest country" },
      { n: 8, dir: "A", row: 11, col: 9, answer: "INDIA", clue: "World's most populous country" },
      { n: 6, dir: "A", row: 9, col: 8, answer: "RUSSIA", clue: "World's largest country by area" },
      { n: 3, dir: "D", row: 7, col: 5, answer: "SINGAPORE", clue: "City-state in Southeast Asia" },
      { n: 7, dir: "A", row: 11, col: 0, answer: "VATICAN", clue: "World's smallest country" },
      { n: 9, dir: "D", row: 11, col: 12, answer: "ICELAND", clue: "Nordic country with no standing army" },
      { n: 4, dir: "D", row: 8, col: 1, answer: "MONACO", clue: "Microstate on the French Riviera" },
      { n: 1, dir: "D", row: 0, col: 7, answer: "AUSTRALIA", clue: "Country that is also a continent" },
      { n: 5, dir: "D", row: 9, col: 3, answer: "CHINA", clue: "Most populous country in Asia" },
    ],
  },
];

// Confetti burst colors — pulled straight from the site palette.
export const CROSSWORD_CONFETTI_COLORS = [
  "#74A57F",
  "#9ECE9A",
  "#E4C5AF",
  "#077187",
  "#74A57F",
  "#E4C5AF",
  "#9ECE9A",
  "#077187",
];
