/**
 * Payment-method icons for the public storefront. Inline SVGs (not <img>)
 * so they crisp at any density and inherit theme colors when needed.
 *
 * Logos are drawn from the brands' own press kits — fair use as
 * payment-method indicators on a checkout page (the universally
 * accepted convention for "we accept X").
 */

import * as React from "react"

interface IconProps {
  className?: string
}

/** PayPal — official two-tone logomark (the stacked "P" with arc). */
export function PayPalIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 302"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M217.168 23.507C203.234 7.625 178.046.816 145.823.816h-93.52A13.393 13.393 0 0 0 39.076 12.11L.136 259.077c-.774 4.87 2.997 9.28 7.933 9.28h57.736l14.5-91.971-.45 2.88c1.033-6.501 6.593-11.296 13.177-11.296h27.436c53.898 0 96.101-21.892 108.429-85.221.366-1.873.683-3.696.957-5.477-1.556-.824-1.556-.824 0 0 3.671-23.407-.025-39.34-12.686-53.765"
        fill="#27346A"
      />
      <path
        d="M102.397 68.84a11.7 11.7 0 0 1 5.275-1.215h73.309c8.683 0 16.78.565 24.18 1.755a101.6 101.6 0 0 1 6.057 1.197 89.276 89.276 0 0 1 8.474 2.254c3.702 1.232 7.146 2.67 10.317 4.337 3.722-23.92-.029-40.205-12.94-55.881C203.51 3.876 178.366-2.27 146.156-2.27H52.61c-6.58 0-12.18 4.788-13.21 11.302L.444 256.288c-.78 4.864 2.99 9.27 7.92 9.27h57.732l30.05-190.44a11.7 11.7 0 0 1 6.251-6.278z"
        fill="#27346A"
      />
      <path
        d="M228.897 82.749c-.276 1.781-.593 3.604-.959 5.477-12.328 63.329-54.531 85.221-108.429 85.221H92.073c-6.584 0-12.144 4.795-13.168 11.296l-14.064 89.155-3.96 25.118c-.671 4.262 2.617 8.124 6.914 8.124h48.671c5.752 0 10.643-4.184 11.546-9.866l.477-2.466 9.166-58.114.59-3.21c.904-5.696 5.795-9.879 11.547-9.879h7.27c47.147 0 84.064-19.154 94.852-74.55 4.503-23.149 2.173-42.483-9.745-56.075-3.613-4.115-8.114-7.5-13.272-10.231z"
        fill="#2790C3"
      />
      <path
        d="M216.952 77.858a89.276 89.276 0 0 0-8.474-2.254 101.6 101.6 0 0 0-6.057-1.197c-7.4-1.19-15.499-1.755-24.18-1.755h-73.309a11.685 11.685 0 0 0-5.275 1.215 11.7 11.7 0 0 0-6.252 6.279l-15.589 98.776-.448 2.88c1.024-6.501 6.584-11.296 13.168-11.296h27.436c53.898 0 96.101-21.892 108.429-85.221.366-1.873.683-3.696.959-5.477-3.171-1.667-6.615-3.105-10.317-4.337a89.276 89.276 0 0 0-.091-.026z"
        fill="#1F264F"
      />
    </svg>
  )
}

/** Zelle — stylized "Z" inside their signature lavender circle. */
export function ZelleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="32" cy="32" r="32" fill="#6D1ED4" />
      <path
        d="M28.5 16h7v3.5h-2.6v3.7h7.7v4.6L24.6 41h11v3.7h-7v3.7h-7v-3.7h2.7v-3.7H17V36l16-12.8H21V18.6h7.5z"
        fill="#fff"
      />
    </svg>
  )
}

/** Efectivo — banknote stack with M90 navy/red palette. */
export function CashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="6"
        y="14"
        width="48"
        height="32"
        rx="4"
        fill="#16a34a"
      />
      <rect
        x="6"
        y="14"
        width="48"
        height="32"
        rx="4"
        fill="none"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      <circle cx="30" cy="30" r="8" fill="none" stroke="#fff" strokeWidth="2" />
      <text
        x="30"
        y="34"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui"
        fontWeight="800"
        fontSize="11"
        fill="#fff"
      >
        $
      </text>
      <circle cx="12" cy="20" r="1.5" fill="#fff" opacity="0.4" />
      <circle cx="48" cy="40" r="1.5" fill="#fff" opacity="0.4" />
    </svg>
  )
}
