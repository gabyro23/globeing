"use client";

import { useEffect, useRef, useState } from "react";
import ShareButton from "./ShareButton";
import { GUESS_COUNTRIES } from "../lib/guessCountryData";
import {
  MAX_LIVES,
  TOTAL_ROUNDS,
  QWERTY_ROWS,
  GUESS_CONFETTI_COLORS,
  pickRoundOrder,
  letterCells,
  isNameGuessed,
  roundScore,
} from "../lib/guessCountryEngine";

function newRoundOrder() {
  return pickRoundOrder(GUESS_COUNTRIES, TOTAL_ROUNDS);
}

function initialGameState() {
  return {
    order: newRoundOrder(),
    roundIndex: 0,
    guessed: new Set(),
    wrongCount: 0,
    hintUsed: false,
    capitalHintUsed: false,
    roundOver: false,
    finished: false,
    score: 0,
    streak: 0,
    correctCount: 0,
  };
}

// Ten-round hangman-style guessing game: a country silhouette is revealed,
// the player guesses letters (keyboard clicks or their physical keyboard)
// with five lives, optional continent/capital hints, and a "reveal a
// letter" option that costs a life. Ported from a standalone design
// prototype ("guessthecountry.html") into the site's component/CSS-variable
// system, reusing the same playful toast + confetti language as Crosswords.
export default function GuessCountryGame() {
  const [state, setState] = useState(initialGameState);
  const [toast, setToast] = useState(null); // { id, text }
  const [shake, setShake] = useState(false);
  const shakeTimeoutRef = useRef(null);

  const current = state.order[state.roundIndex];
  const won = state.roundOver && current && isNameGuessed(current.name, state.guessed);

  // Auto-dismiss the celebration toast + confetti.
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  function triggerShake() {
    setShake(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setShake(false), 400);
  }

  function finishGuess(next) {
    if (isNameGuessed(current.name, next.guessed)) {
      const gained = roundScore(next.wrongCount);
      setState({
        ...next,
        roundOver: true,
        score: next.score + gained,
        streak: next.streak + 1,
        correctCount: next.correctCount + 1,
      });
      setToast({ id: `${current.name}-${next.roundIndex}-win`, text: `Correct! ${current.flag} ${current.name}` });
    } else if (next.wrongCount >= MAX_LIVES) {
      setState({ ...next, roundOver: true, streak: 0 });
    } else {
      setState(next);
    }
  }

  function applyGuess(ch) {
    if (!current || state.roundOver || state.finished || state.guessed.has(ch)) return;
    const guessed = new Set(state.guessed);
    guessed.add(ch);
    const correct = current.name.includes(ch);
    const wrongCount = state.wrongCount + (correct ? 0 : 1);
    if (!correct) triggerShake();
    finishGuess({ ...state, guessed, wrongCount });
  }

  function revealLetter() {
    if (!current || state.roundOver || state.finished) return;
    if (state.wrongCount >= MAX_LIVES - 1) return;
    const remaining = letterCells(current.name).filter((ch) => ch !== " " && !state.guessed.has(ch));
    if (!remaining.length) return;
    const ch = remaining[Math.floor(Math.random() * remaining.length)];
    const guessed = new Set(state.guessed);
    guessed.add(ch);
    finishGuess({ ...state, guessed, wrongCount: state.wrongCount + 1 });
  }

  function useContinentHint() {
    if (state.hintUsed || state.roundOver) return;
    setState((s) => ({ ...s, hintUsed: true }));
  }

  function useCapitalHint() {
    if (state.capitalHintUsed || state.roundOver) return;
    setState((s) => ({ ...s, capitalHintUsed: true }));
  }

  function nextRound() {
    setToast(null);
    setState((s) => {
      const nextIndex = s.roundIndex + 1;
      if (nextIndex >= s.order.length) return { ...s, finished: true };
      return {
        ...s,
        roundIndex: nextIndex,
        guessed: new Set(),
        wrongCount: 0,
        hintUsed: false,
        capitalHintUsed: false,
        roundOver: false,
      };
    });
  }

  function newGame() {
    setToast(null);
    setState(initialGameState());
  }

  // Physical keyboard support, mirroring the on-screen keys.
  useEffect(() => {
    function onKeyDown(e) {
      if (state.finished) return;
      const ch = e.key.toUpperCase();
      if (ch.length === 1 && ch >= "A" && ch <= "Z") applyGuess(ch);
      else if (e.key === "Enter" && state.roundOver) nextRound();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!current) return null;

  const hintLine = [state.hintUsed && current.continent, state.capitalHintUsed && `Capital: ${current.capital}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="guess-country-game">
      <div className="guess-country-hero">
        <div className="guess-country-hero__copy">
          <h1 className="app-hero__title">Guess the country</h1>
          <p className="app-hero__subtitle">
            Ten silhouettes, five lives each. Type a letter or tap the keyboard to guess.
          </p>
        </div>
        <div className="guess-country-stats">
          <div className="guess-country-stat">
            <div className="guess-country-stat__label">Round</div>
            <div className="guess-country-stat__value">
              {Math.min(state.roundIndex + 1, state.order.length)}/{state.order.length}
            </div>
          </div>
          <div className="guess-country-stat">
            <div className="guess-country-stat__label">Score</div>
            <div className="guess-country-stat__value">{state.score}</div>
          </div>
          <div className="guess-country-stat">
            <div className="guess-country-stat__label">Streak</div>
            <div className="guess-country-stat__value">{state.streak}</div>
          </div>
          <ShareButton
            path="/guess-the-country"
            title="Guess the Country — Globeing"
            text={`I'm ${state.score} points into Globeing's "Guess the Country" game. Dare your friends to beat my score!`}
            label="Dare your friends"
            className="share-button share-button--labeled guess-country-share-btn"
          />
        </div>
      </div>

      <div className="guess-country-panel">
        {state.finished ? (
          <div className="guess-country-summary">
            <div className="guess-country-summary__eyebrow">
              {state.correctCount === state.order.length ? "Perfect round!" : "Game over!"}
            </div>
            <div className="guess-country-summary__score">{state.score}</div>
            <div className="guess-country-summary__sub">
              {state.correctCount} of {state.order.length} countries correct
            </div>
            <button type="button" className="guess-country-pbtn guess-country-pbtn--primary" onClick={newGame}>
              Play again
            </button>
          </div>
        ) : (
          <div className="guess-country-area">
            <div className="guess-country-lives-row">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={"guess-country-life" + (i < state.wrongCount ? " is-lost" : "")} />
              ))}
            </div>

            <div className="guess-country-silhouette-wrap">
              <svg
                viewBox={current.viewBox}
                width={Math.min(340, current.width)}
                height={Math.min(230, current.height)}
                className={"guess-country-silhouette" + (shake ? " is-shake" : "")}
                role="img"
                aria-label={`Silhouette of ${state.roundOver ? current.name : "a mystery country"}`}
              >
                <defs>
                  <linearGradient id="guess-ctry-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sage-light)" />
                    <stop offset="55%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-deep)" />
                  </linearGradient>
                  <filter id="guess-ctry-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" />
                  </filter>
                </defs>
                <path d={current.path} fill="var(--ink)" opacity="0.2" filter="url(#guess-ctry-shadow)" transform="translate(4 6)" />
                <path d={current.path} fill="url(#guess-ctry-fill)" stroke="var(--accent-deep)" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>

              {toast && (
                <>
                  <div className="guess-country-toast">{toast.text}</div>
                  {GUESS_CONFETTI_COLORS.map((col, i) => {
                    const dx = Math.round(Math.cos((i / 8) * 6.28) * 90);
                    const dy = Math.round(Math.sin((i / 8) * 6.28) * 60 - 30);
                    return (
                      <div
                        key={`${toast.id}-${i}`}
                        className="guess-country-confetti-dot"
                        style={{ background: col, "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 30}ms` }}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {hintLine && <div className="guess-country-hint-line">{hintLine}</div>}

            <div className="guess-country-blanks">
              {letterCells(current.name).map((ch, i) =>
                ch === " " ? (
                  <div key={i} className="guess-country-blank-space" />
                ) : (
                  <div
                    key={i}
                    className={"guess-country-blank" + (state.guessed.has(ch) || state.roundOver ? " is-filled" : "")}
                  >
                    {state.guessed.has(ch) || state.roundOver ? ch : ""}
                  </div>
                )
              )}
            </div>

            {state.roundOver && (
              <>
                <div className={"guess-country-message" + (won ? " is-win" : " is-lose")}>
                  {won ? "Correct!" : `The answer was ${current.name}`}
                </div>
                <div className="guess-country-fact-line">
                  {current.flag} {current.fact}
                </div>
              </>
            )}

            <div className="guess-country-keyboard">
              {QWERTY_ROWS.map((row, ri) => (
                <div key={ri} className="guess-country-kb-row">
                  {row.split("").map((ch) => {
                    const used = state.guessed.has(ch);
                    const correct = used && current.name.includes(ch);
                    const wrong = used && !correct;
                    return (
                      <button
                        key={ch}
                        type="button"
                        className={
                          "guess-country-key" + (correct ? " is-correct" : "") + (wrong ? " is-wrong" : "")
                        }
                        disabled={state.roundOver || used}
                        onClick={() => applyGuess(ch)}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="guess-country-btn-row">
              <button
                type="button"
                className="guess-country-pbtn"
                disabled={state.hintUsed || state.roundOver}
                onClick={useContinentHint}
              >
                Continent hint
              </button>
              <button
                type="button"
                className="guess-country-pbtn"
                disabled={state.capitalHintUsed || state.roundOver}
                onClick={useCapitalHint}
              >
                Capital hint
              </button>
              <button
                type="button"
                className="guess-country-pbtn"
                disabled={state.roundOver || state.wrongCount >= MAX_LIVES - 1}
                onClick={revealLetter}
              >
                Reveal a letter (−1 life)
              </button>
              <button type="button" className="guess-country-pbtn guess-country-pbtn--primary" onClick={nextRound}>
                {state.roundIndex === state.order.length - 1 ? "See results →" : "Next country →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
