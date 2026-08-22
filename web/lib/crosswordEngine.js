// Pure helpers shared by the crossword board: turning a puzzle's word list
// into a lookup grid, walking a word's cells, and checking solved state.
// Kept side-effect free so CrosswordGame.jsx can call them straight from
// render without needing to worry about stale state.

// Precomputes { [row-col]: { r, c, words: {A?, D?}, answer, num? } } for a
// puzzle so the board can be drawn cell-by-cell in a single pass.
export function buildCrosswordGrid(words) {
  const grid = {};
  words.forEach((w) => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.dir === "A" ? w.row : w.row + i;
      const c = w.dir === "A" ? w.col + i : w.col;
      const key = `${r}-${c}`;
      grid[key] = grid[key] || { r, c, words: {} };
      grid[key].words[w.dir] = w;
      grid[key].answer = w.answer[i];
    }
  });
  words.forEach((w) => {
    const key = `${w.row}-${w.col}`;
    if (!grid[key].num) grid[key].num = w.n;
  });
  return grid;
}

// The list of {r, c} cells a word occupies, in order.
export function cellsOfWord(word) {
  const cells = [];
  for (let i = 0; i < word.answer.length; i++) {
    cells.push(word.dir === "A" ? { r: word.row, c: word.col + i } : { r: word.row + i, c: word.col });
  }
  return cells;
}

export function isWordSolved(word, letters) {
  return cellsOfWord(word).every((p, i) => (letters[`${p.r}-${p.c}`] || "") === word.answer[i]);
}

// Which word the currently-active cell belongs to, preferring the active
// direction and falling back to whichever direction the cell actually has.
export function activeWordFor(grid, words, active) {
  const cell = grid[`${active.r}-${active.c}`];
  if (!cell) return words[0];
  return cell.words[active.dir] || cell.words[active.dir === "A" ? "D" : "A"];
}
