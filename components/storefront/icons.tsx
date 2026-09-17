/** Inline storefront icons (outline style, matching site SVG usage). */

type IconProps = {
  className?: string;
  title?: string;
};

export function ShoppingBagIcon({ className, title }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M6.5 9.5V8.25C6.5 5.35 8.85 3 11.75 3h.5C15.15 3 17.5 5.35 17.5 8.25V9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 21h7.6c1.66 0 3.05-1.25 3.23-2.9l.85-7.65A1.75 1.75 0 0 0 18.14 8.5H5.86a1.75 1.75 0 0 0-1.74 1.95l.85 7.65C5.15 19.75 6.54 21 8.2 21Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Filled shopping bag in brand red + white for the live shop nav bar. */
export function ShopNavBagIcon({ className, title }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M8.2 21h7.6c1.66 0 3.05-1.25 3.23-2.9l.85-7.65A1.75 1.75 0 0 0 18.14 8.5H5.86a1.75 1.75 0 0 0-1.74 1.95l.85 7.65C5.15 19.75 6.54 21 8.2 21Z"
        fill="#e40613"
      />
      <path
        d="M6.5 9.5V8.25C6.5 5.35 8.85 3 11.75 3h.5C15.15 3 17.5 5.35 17.5 8.25V9.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 21h7.6c1.66 0 3.05-1.25 3.23-2.9l.85-7.65A1.75 1.75 0 0 0 18.14 8.5H5.86a1.75 1.75 0 0 0-1.74 1.95l.85 7.65C5.15 19.75 6.54 21 8.2 21Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
