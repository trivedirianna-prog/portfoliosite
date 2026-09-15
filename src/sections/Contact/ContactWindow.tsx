import { useEffect, useRef, useState, type FormEvent } from "react";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { useIsMirror } from "../../windows/mirrorContext";
import { publish, subscribe } from "../../windows/liveMirror";
import "./ContactWindow.css";

/*
  Formspree endpoint — replace YOUR_FORM_ID with a real Formspree form ID
  (formspree.io) configured to deliver to trivedirianna@gmail.com. Every
  other piece here (validation, the sending/success/error states below)
  already works end-to-end; without a real ID, Formspree itself returns a
  404 and that surfaces through the same error state.
*/
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

type SendStatus = "idle" | "sending" | "success" | "error";

/*
  Contact's window is the site's one deliberately "glass" glossy surface
  (§10's variation-within-the-glossy-family) rather than the opaque
  plum-gradient panels Projects uses — translucent + blurred, fitting a
  transmission device's own material logic. Two distinct content roles
  per §8.5: a functional form (name/email/a themed message field) and,
  separately below it, a plain footnote/signature block — not folded into
  the form fields themselves.

  `openFromOrigin={false}` — unlike every other window, this one opens
  already centered rather than emerging from its spawning object's own
  desktop position (the device sits off in a scattered corner per §3;
  the window shouldn't read as anchored there even momentarily). Closing
  still retracts back to the device via the same `originRect`, unaffected.
*/
export function ContactWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const [status, setStatus] = useState<SendStatus>("idle");
  const isMirror = useIsMirror();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Live-mirrors typed text into Take Two's desktop mirror (§8.3): these
  // are plain uncontrolled fields (no value/onChange — React never holds
  // their text), so the mirror's own separate <input> DOM nodes have no
  // way to see what's typed here otherwise. The REAL instance publishes
  // on every `input` event; the MIRROR instance (a separate React tree)
  // subscribes and writes straight to its own field's `.value`, skipping
  // React state entirely so typing doesn't re-render either tree. The
  // mirror is pointer-events:none (TakeTwoWindow.css), so there's no
  // risk of it ever publishing back and feeding into a loop.
  useEffect(() => {
    const fields: [string, HTMLInputElement | HTMLTextAreaElement | null][] = [
      ["name", nameRef.current],
      ["email", emailRef.current],
      ["message", messageRef.current],
    ];

    if (isMirror) {
      const unsubscribers = fields.map(([key, el]) => {
        if (!el) return () => {};
        return subscribe<string>(`contact-field:${windowId}:${key}`, (value) => {
          el.value = value;
        });
      });
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    const cleanups = fields.map(([key, el]) => {
      if (!el) return () => {};
      const handleInput = () => publish(`contact-field:${windowId}:${key}`, el.value);
      el.addEventListener("input", handleInput);
      return () => el.removeEventListener("input", handleInput);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isMirror, windowId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <Window
      windowId={windowId}
      title="Contact"
      material="glossy"
      className="contact-window--shape"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.contact ?? null}
      openFromOrigin={false}
      style={{ width: "min(92vw, 420px)" }}
    >
      <div className="contact-window">
        <p className="contact-window__intro">
          Open a channel — send a transmission and it reaches me directly.
        </p>

        <form className="contact-window__form" onSubmit={handleSubmit}>
          <label className="contact-window__field">
            <span className="contact-window__field-label label-mono">Name</span>
            <input
              ref={nameRef}
              className="contact-window__input"
              type="text"
              name="name"
              autoComplete="name"
              required
              disabled={status === "sending"}
            />
          </label>
          <label className="contact-window__field">
            <span className="contact-window__field-label label-mono">Email</span>
            <input
              ref={emailRef}
              className="contact-window__input"
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={status === "sending"}
            />
          </label>
          <label className="contact-window__field">
            <span className="contact-window__field-label label-mono">
              Your transmission
            </span>
            <textarea
              ref={messageRef}
              className="contact-window__input contact-window__input--area"
              name="message"
              rows={4}
              required
              disabled={status === "sending"}
            />
          </label>

          <button
            type="submit"
            className="contact-window__submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Transmitting…" : "Send Transmission"}
          </button>

          {status === "success" && (
            <p
              className="contact-window__notice contact-window__notice--success"
              role="status"
            >
              Signal received — thanks, I&apos;ll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p
              className="contact-window__notice contact-window__notice--error"
              role="alert"
            >
              Transmission failed — please try again, or reach me directly below.
            </p>
          )}
        </form>

        <div className="contact-window__footnote">
          <a
            className="contact-window__footnote-line"
            href="mailto:trivedirianna@gmail.com"
          >
            trivedirianna@gmail.com
          </a>
          <a
            className="contact-window__footnote-line"
            href="https://github.com/trivedirianna-prog"
            target="_blank"
            rel="noreferrer"
          >
            github.com/trivedirianna-prog
          </a>
          <span className="contact-window__footnote-line">+91 98920 69504</span>
        </div>
      </div>
    </Window>
  );
}
