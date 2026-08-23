"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CROSSWORD_PUZZLES, CROSSWORD_CONFETTI_COLORS } from "../lib/crosswordPuzzles";
import { buildCrosswordGrid, cellsOfWord, isWordSolved, activeWordFor } from "../lib/crosswordEngine";
import ShareButton from "./ShareButton";

const LETTER_PATTERN = /[^A-ZÑÁÉÍÓÚ]/g;

function initialPuzzleState(puzzle) {
  const first = puzzle.words[0];
  return {
    letters: {},
    active: { r: first.row, c: first.col, dir: first.dir },
    checked: false,
    seconds: 0,
    running: false,
  };
}

// Five themed crossword boards (capitals, currencies, orgs, physical
// geography, country trivia). Ported from a standalone design prototype
// into the site's component/CSS-variable system — same board logic and
// playful "board game" feel (3D buttons, confetti burst, wobbly solved
// cells), re-themed to the Globeing palette.
export default function CrosswordGame() {
  const puzzles = useMemo(
    () => CROSSWORD_PUZZLES.map((p) => ({ ...p, grid: buildCrosswordGrid(p.words) })),
    []
  );
  const [current, setCurrent] = useState(0);
  const [puzzleStates, setPuzzleStates] = useState(() => puzzles.map(initialPuzzleState));
  const [toast, setToast] = useState(null); // { id, text }
  const cellRefs = useRef({});

  const puzzle = puzzles[current];
  const state = puzzleStates[current];
  const activeWord = activeWordFor(puzzle.grid, puzzle.words, state.active);

  const solvedWords = useMemo(
    () => puzzle.words.filter((w) => isWordSolved(w, state.letters)),
    [puzzle, state.letters]
  );
  const solvedCount = solvedWords.length;

  const activeKeys = useMemo(() => {
    const keys = new Set();
    if (activeWord) cellsOfWord(activeWord).forEach((p) => keys.add(`${p.r}-${p.c}`));
    return keys;
  }, [activeWord]);

  const solvedKeys = useMemo(() => {
    const keys = new Set();
    solvedWords.forEach((w) => cellsOfWord(w).forEach((p) => keys.add(`${p.r}-${p.c}`)));
    return keys;
  }, [solvedWords]);

  // Keep the focused DOM cell in sync with "active" — simpler and less
  // error-prone than calling .focus() from inside every event handler.
  useEffect(() => {
    const el = cellRefs.current[`${state.active.r}-${state.active.c}`];
    if (el && document.activeElement !== el) {
      el.focus();
      el.select?.();
    }
  }, [current, state.active.r, state.active.c]);

  // One shared clock, ticking whichever puzzle is currently open and
  // running (each board keeps its own elapsed time independently).
  useEffect(() => {
    const id = setInterval(() => {
      setPuzzleStates((prev) => {
        if (!prev[current].running) return prev;
        const next = prev.slice();
        next[current] = { ...next[current], seconds: next[current].seconds + 1 };
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [current]);

  // Auto-dismiss the celebration toast + confetti.
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  function updateCurrent(updater) {
    setPuzzleStates((prev) => {
      const next = prev.slice();
      next[current] = updater(next[current]);
      return next;
    });
  }

  function select(r, c, dirPref, allowToggle) {
    const cell = puzzle.grid[`${r}-${c}`];
    if (!cell) return;
    updateCurrent((s) => {
      let dir = dirPref || s.active.dir;
      if (!dirPref && allowToggle && s.active.r === r && s.active.c === c && cell.words.A && cell.words.D) {
        dir = s.active.dir === "A" ? "D" : "A";
      }
      if (!cell.words[dir]) dir = dir === "A" ? "D" : "A";
      return { ...s, active: { r, c, dir } };
    });
  }

  function selectWord(w) {
    updateCurrent((s) => ({ ...s, active: { r: w.row, c: w.col, dir: w.dir } }));
  }

  function step(back) {
    updateCurrent((s) => {
      const dr = s.active.dir === "D" ? (back ? -1 : 1) : 0;
      const dc = s.active.dir === "A" ? (back ? -1 : 1) : 0;
      const nr = s.active.r + dr;
      const nc = s.active.c + dc;
      if (!puzzle.grid[`${nr}-${nc}`]) return s;
      return { ...s, active: { r: nr, c: nc, dir: s.active.dir } };
    });
  }

  function celebrate(word, letters) {
    const allDone = puzzle.words.every((w) => w === word || isWordSolved(w, letters));
    const text = allDone
      ? `Complete! ${puzzle.words.length} of ${puzzle.words.length}`
      : word.answer.charAt(0) + word.answer.slice(1).toLowerCase() + "!";
    setToast({ id: `${word.dir}-${word.n}-${Date.now()}`, text });
  }

  function write(r, c, ch) {
    const key = `${r}-${c}`;
    const beforeSolved = new Set(puzzle.words.filter((w) => isWordSolved(w, state.letters)));
    const letters = { ...state.letters };
    if (ch) letters[key] = ch;
    else delete letters[key];

    updateCurrent((s) => ({ ...s, letters, checked: false, running: true }));

    if (ch) {
      const justSolved = puzzle.words.find((w) => !beforeSolved.has(w) && isWordSolved(w, letters));
      if (justSolved) celebrate(justSolved, letters);
      step(false);
    }
  }

  function hint() {
    if (!activeWord) return;
    const pts = cellsOfWord(activeWord);
    for (let i = 0; i < pts.length; i++) {
      const k = `${pts[i].r}-${pts[i].c}`;
      if ((state.letters[k] || "") !== activeWord.answer[i]) {
        write(pts[i].r, pts[i].c, activeWord.answer[i]);
        return;
      }
    }
  }

  function handleCheck() {
    updateCurrent((s) => ({ ...s, checked: true, running: true }));
  }

  function handleClear() {
    updateCurrent((s) => ({ ...s, letters: {}, checked: false, seconds: 0, running: false }));
  }

  const cellSize = Math.max(28, Math.min(52, Math.floor(600 / puzzle.width)));
  const progressCopy =
    solvedCount === 0
      ? "Tap a cell to get started"
      : solvedCount === puzzle.words.length
        ? "Board complete, nice work"
        : `${solvedCount} of ${puzzle.words.length} words — keep going`;
  const hintLine = activeWord
    ? `${activeWord.n} ${activeWord.dir === "A" ? "across" : "down"} · ${activeWord.clue} (${activeWord.answer.length} letters)`
    : "";
  const mm = String(Math.floor(state.seconds / 60)).padStart(2, "0");
  const ss = String(state.seconds % 60).padStart(2, "0");

  return (
    <div className="crossword-game">
      <div className="crossword-hero">
        <div className="crossword-hero__copy">
          <h1 className="app-hero__title">Crosswords of the world</h1>
          <p className="app-hero__subtitle">Five geopolitics boards. Pick one, tap a cell, and start typing.</p>
        </div>
        <div className="crossword-stats">
          <div className="crossword-stat">
            <div className="crossword-stat__label">Solved</div>
            <div className="crossword-stat__value">
              {solvedCount}/{puzzle.words.length}
            </div>
          </div>
          <div className="crossword-stat">
            <div className="crossword-stat__label">Time</div>
            <div className="crossword-stat__value">
              {mm}:{ss}
            </div>
          </div>
          <ShareButton
            path="/crosswords"
            title={`Crosswords of the world — ${puzzle.title}`}
            text={`I'm ${solvedCount}/${puzzle.words.length} words into the "${puzzle.title}" crossword on Globeing. Dare your friends to beat your time!`}
            label="Dare your friends"
            className="share-button share-button--labeled crossword-share-btn"
          />
        </div>
      </div>

      <div className="crossword-tabs">
        {puzzles.map((p, i) => (
          <button
            key={p.title}
            type="button"
            className={"crossword-tab" + (i === current ? " is-active" : "")}
            onClick={() => {
              setCurrent(i);
              setToast(null); // don't let a celebration toast bleed into the next board
            }}
          >
            <span className="crossword-tab__num">{i + 1}</span>
            <span>{p.title}</span>
          </button>
        ))}
      </div>

      <div className="crossword-board-area">
        <div className="crossword-panel crossword-board-panel">
          <div className="crossword-toolbar">
            <div>
              <div className="crossword-pills">
                {puzzle.words.map((_, i) => (
                  <div
                    key={i}
                    className={
                      "crossword-pill" + (i < solvedCount ? (i === solvedCount - 1 ? " is-last" : " is-done") : "")
                    }
                  />
                ))}
              </div>
              <div className="crossword-progress-copy">{progressCopy}</div>
            </div>
            <div className="crossword-btn-row">
              <button type="button" className="crossword-btn" onClick={hint}>
                Hint
              </button>
              <button type="button" className="crossword-btn" onClick={handleCheck}>
                Check
              </button>
              <button type="button" className="crossword-btn crossword-btn--primary" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          <div className="crossword-board-wrap">
            <div className="crossword-board-inner">
              <div
                className="crossword-board"
                style={{ gridTemplateColumns: `repeat(${puzzle.width}, ${cellSize}px)`, gap: "5px" }}
              >
                {Array.from({ length: puzzle.height }).map((_, r) =>
                  Array.from({ length: puzzle.width }).map((_, c) => {
                    const key = `${r}-${c}`;
                    const cell = puzzle.grid[key];
                    if (!cell) {
                      return (
                        <div key={key} className="crossword-cellwrap" style={{ width: cellSize, height: cellSize }} />
                      );
                    }

                    const isActive = state.active.r === r && state.active.c === c;
                    const value = state.letters[key] || "";
                    const wrong = state.checked && value && value !== cell.answer;
                    const solved = solvedKeys.has(key);
                    const inActiveWord = activeKeys.has(key);

                    let bg = "var(--surface)";
                    let border = "#DCE7E3";
                    let color = "var(--ink)";
                    let shadow = "0 2px 0 rgba(7,79,87,.10)";
                    let transform = "none";

                    if (solved) {
                      bg = "var(--sage-light)";
                      border = "var(--sage)";
                      color = "var(--accent-deep)";
                      shadow = "0 2px 0 rgba(7,79,87,.16)";
                      transform = `rotate(${(r + c) % 2 ? -1.5 : 1.5}deg)`;
                    }
                    if (wrong) {
                      bg = "var(--sand)";
                      border = "var(--crossword-sand-border)";
                      color = "var(--crossword-sand-text)";
                    }
                    if (inActiveWord && !solved && !wrong) {
                      bg = "var(--sage-bg-strong)";
                      border = "var(--crossword-sel-border)";
                    }
                    if (isActive) {
                      border = "var(--accent)";
                      shadow = "0 0 0 5px rgba(7,113,135,.16), 0 3px 0 rgba(7,79,87,.18)";
                      transform = "scale(1.07)";
                    }

                    return (
                      <div
                        key={key}
                        className={"crossword-cellwrap" + (solved ? " is-solved" : "")}
                        style={{ width: cellSize, height: cellSize }}
                      >
                        {cell.num && <span className="crossword-cellnum">{cell.num}</span>}
                        <input
                          ref={(el) => {
                            if (el) cellRefs.current[key] = el;
                            else delete cellRefs.current[key];
                          }}
                          maxLength={1}
                          autoComplete="off"
                          aria-label={`Row ${r + 1}, column ${c + 1}`}
                          value={value}
                          style={{
                            fontSize: Math.round(cellSize * 0.46),
                            borderRadius: Math.round(cellSize * 0.22),
                            background: bg,
                            borderColor: border,
                            color,
                            boxShadow: shadow,
                            transform,
                          }}
                          onFocus={() => select(r, c, null, false)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            select(r, c, null, true);
                          }}
                          onChange={(e) => {
                            const raw = (e.target.value || "").toUpperCase().replace(LETTER_PATTERN, "");
                            write(r, c, raw.slice(-1));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace") {
                              e.preventDefault();
                              if (state.letters[key]) write(r, c, "");
                              else step(true);
                            } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                              e.preventDefault();
                              const nc = c + (e.key === "ArrowRight" ? 1 : -1);
                              if (puzzle.grid[`${r}-${nc}`]) select(r, nc, "A");
                            } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                              e.preventDefault();
                              const nr = r + (e.key === "ArrowDown" ? 1 : -1);
                              if (puzzle.grid[`${nr}-${c}`]) select(nr, c, "D");
                            } else if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              select(r, c);
                            }
                          }}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {toast && (
                <>
                  <div className="crossword-toast">{toast.text}</div>
                  {CROSSWORD_CONFETTI_COLORS.map((col, i) => {
                    const dx = Math.round(Math.cos((i / 8) * 6.28) * 90);
                    const dy = Math.round(Math.sin((i / 8) * 6.28) * 60 - 30);
                    return (
                      <div
                        key={`${toast.id}-${i}`}
                        className="crossword-confetti-dot"
                        style={{ background: col, "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 30}ms` }}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>
          <div className="crossword-hint-line">{hintLine}</div>
        </div>

        <div className="crossword-panel crossword-clue-panel">
          <div className="crossword-clue-title">Across</div>
          <div className="crossword-clue-group">
            {puzzle.words
              .filter((w) => w.dir === "A")
              .sort((a, b) => a.n - b.n)
              .map((w) => (
                <ClueButton key={`A-${w.n}-${w.row}-${w.col}`} word={w} activeWord={activeWord} letters={state.letters} onSelect={selectWord} />
              ))}
          </div>
          <div className="crossword-clue-title">Down</div>
          <div className="crossword-clue-group">
            {puzzle.words
              .filter((w) => w.dir === "D")
              .sort((a, b) => a.n - b.n)
              .map((w) => (
                <ClueButton key={`D-${w.n}-${w.row}-${w.col}`} word={w} activeWord={activeWord} letters={state.letters} onSelect={selectWord} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClueButton({ word, activeWord, letters, onSelect }) {
  const solved = isWordSolved(word, letters);
  const isActive = activeWord && activeWord.n === word.n && activeWord.dir === word.dir;
  return (
    <button
      type="button"
      className={"crossword-clue-btn" + (isActive ? " is-active" : "")}
      onClick={() => onSelect(word)}
    >
      <span className={"crossword-clue-num" + (solved ? " is-solved" : "")}>{word.n}</span>
      <span className={"crossword-clue-text" + (solved ? " is-solved" : "")}>
        {word.clue} <span className="crossword-clue-len">({word.answer.length})</span>
      </span>
      <span className={"crossword-clue-tick" + (solved ? " is-shown" : "")}>✓</span>
    </button>
  );
}
