"use client";

import { useState } from "react";

const CONTACT_EMAIL = "gabyro23@gmail.com";

const CONTACT_METHODS = [
  { icon: "✉", label: "Email", value: "gabyro23@gmail.com" },
  { icon: "⌘", label: "Website", value: "globeing.co" },
  { icon: "◎", label: "Office", value: "Barcelona, Spain" },
];

// Contact page: a short intro + contact details on the left, a message
// form on the right. Ported from a standalone design prototype into the
// site's own layout/tokens/language.
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", message: "" });
  const [status, setStatus] = useState("");

  function updateField(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setStatus("");
    };
  }

  // No backend: the form just opens the visitor's own email app with a
  // message to CONTACT_EMAIL already filled in (mailto:).
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) {
      setStatus("Please write a message first.");
      return;
    }
    const subject = form.name.trim() ? `Globeing — message from ${form.name.trim()}` : "Globeing — message";
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(form.message)}`;
    window.location.href = href;
    setStatus(`Your email app should open now. If it doesn't, write to us at ${CONTACT_EMAIL}.`);
  }

  return (
    <div className="contact-page">
      <div className="contact-page__intro">
        <h1 className="app-hero__title">Contact us</h1>
        <p className="app-hero__subtitle">
          Have questions about the data, need help comparing countries, or want to share feedback?
          We&apos;d love to hear from you.
        </p>

        <div className="contact-methods">
          {CONTACT_METHODS.map((m) => (
            <div className="contact-method" key={m.label}>
              <div className="contact-method__icon" aria-hidden="true">
                {m.icon}
              </div>
              <div>
                <div className="contact-method__label">{m.label}</div>
                <div className="contact-method__value">{m.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <h2 className="contact-form__title">Get in touch.</h2>

        <label className="contact-form__label" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          className="contact-form__input"
          value={form.name}
          onChange={updateField("name")}
          placeholder="Your name"
        />

        <label className="contact-form__label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="contact-form__input contact-form__input--textarea"
          value={form.message}
          onChange={updateField("message")}
          placeholder="How can we help?"
          required
        />

        <div className="contact-form__footer">
          <button type="submit" className="contact-form__submit">
            Open in my email app
          </button>
          {status && <span className="contact-form__status">{status}</span>}
        </div>
      </form>
    </div>
  );
}
