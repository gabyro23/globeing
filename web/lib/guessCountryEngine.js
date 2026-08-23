// Pure helpers for the Guess the Country game — no side effects, so they're
// easy to reason about independent of React. Mirrors the shape of
// crosswordEngine.js: small, testable functions the component calls
// straight from render/handlers.

export const MAX_LIVES = 5;
export const TOTAL_ROUNDS = 10;

export const GUESS_CONFETTI_COLORS = [
  "#74A57F",
  "#9ECE9A",
  "#E4C5AF",
  "#077187",
  "#74A57F",
  "#E4C5AF",
  "#9ECE9A",
  "#077187",
];

export const QWERTY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// Fisher-Yates shuffle — returns a new array, never mutates the input.
export function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// Picks `count` countries at random, no repeats, from the full list.
export function pickRoundOrder(countries, count) {
  return shuffle(countries).slice(0, Math.min(count, countries.length));
}

// A name split into display cells: letters to guess, plus literal spaces
// (rendered as a gap, never guessable, never counted against the win check).
export function letterCells(name) {
  return name.split("");
}

// True once every non-space character in `name` has been guessed.
export function isNameGuessed(name, guessedSet) {
  return letterCells(name).every((ch) => ch === " " || guessedSet.has(ch));
}

// Points awarded for a round win: fewer wrong guesses -> more points, floor of 1.
export function roundScore(wrongCount) {
  return Math.max(1, MAX_LIVES - wrongCount);
}
