"use client";

import { useState } from "react";

const CONTACT_METHODS = [
  { icon: "✉", label: "Email", value: "gabyro23@gmail.com" },
  { icon: "⌘", label: "Website", value: "globeing.com" },
  { icon: "◎", label: "Office", value: "Barcelona,Spain" },
];

// Contact page: a short intro + contact details on the left, a message
// form on the right. Ported from a standalone design prototype into the
// site's own layout/tokens/language.
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("");

  function updateField(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setStatus("");
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    setStatus(form.email ? "Thanks — we'll get back to you within 48 hours." : "Please add your email.");
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

        <label className="contact-form__label" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          className="contact-form__input"
          value={form.email}
          onChange={updateField("email")}
          placeholder="you@email.com"
        />

        <label className="contact-form__label" htmlFor="contact-phone">
          Phone <span className="contact-form__label-optional">(optional)</span>
        </label>
        <input
          id="contact-phone"
          className="contact-form__input"
          value={form.phone}
          onChange={updateField("phone")}
          placeholder="+34 111 000 000"
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
        />

        <div className="contact-form__footer">
          <button type="submit" className="contact-form__submit">
            Send message
          </button>
          {status && <span className="contact-form__status">{status}</span>}
        </div>
      </form>
    </div>
  );
}
