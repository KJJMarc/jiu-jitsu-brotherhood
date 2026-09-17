"use client";

export default function ManageCookiesButton() {
  return (
    <button
      type="button"
      className="btn btn--outline"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("kjj-open-cookie-settings"))
      }
    >
      Manage Cookie Preferences
    </button>
  );
}
