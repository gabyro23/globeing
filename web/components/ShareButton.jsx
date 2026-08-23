"use client";

import { useEffect, useState } from "react";

// Classic "share" glyph: three connected nodes.
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.6 10.5 L15.4 6.5 M8.6 13.5 L15.4 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SHARE_TARGETS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    bg: "#25d366",
    glyph: "☎",
    hrefFor: ({ text, url }) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    bg: "#0a66c2",
    glyph: "in",
    hrefFor: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    bg: "#1877f2",
    glyph: "f",
    hrefFor: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "x",
    label: "X",
    bg: "#1e2a2c",
    glyph: "X",
    hrefFor: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "email",
    label: "Email",
    bg: "var(--accent)",
    glyph: "✉",
    hrefFor: ({ title, text, url }) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

// Reusable share trigger + popup: an icon (optionally labeled) that opens a
// small modal with social share links and a copyable URL. Ported from a
// standalone design prototype ("Share Popup") into a component so it can
// be dropped anywhere on the site with different copy per context (a
// random fact, a crossword board, eventually a saved comparison).
//
// - path: page to share, e.g. "/random-facts" — resolved to an absolute
//   URL client-side (window.location.origin), so it's correct on
//   localhost, a Vercel preview, or the final domain.
// - title: short caption shown in the modal + used as the email subject.
// - text: the actual message body for WhatsApp/X/Email.
// - label: optional visible button text (icon-only when omitted).
export default function ShareButton({ path, title, text, label, className }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Resolved straight from render (no state/effect needed): matches `path`
  // during SSR, and picks up the real origin once the browser has one.
  const url = typeof window !== "undefined" ? window.location.origin + path : path;

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
  }

  return (
    <>
      <button
        type="button"
        className={className || "share-button share-button--icon"}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <ShareIcon />
        {label && <span>{label}</span>}
      </button>

      {open && (
        <div className="share-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-modal__header">
              <h2>Share</h2>
              <button type="button" className="share-modal__close" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <p className="share-modal__subtitle">{title}</p>

            <div className="share-modal__grid">
              {SHARE_TARGETS.map((t) => (
                <a
                  key={t.key}
                  href={t.hrefFor({ title, text, url })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-modal__option"
                >
                  <span className="share-modal__option-icon" style={{ background: t.bg }}>
                    {t.glyph}
                  </span>
                  <span>{t.label}</span>
                </a>
              ))}
            </div>

            <div className="share-modal__link-label">Link</div>
            <div className="share-modal__link-row">
              <div className="share-modal__link-box">{url}</div>
              <button type="button" className="share-modal__copy" onClick={handleCopy}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
