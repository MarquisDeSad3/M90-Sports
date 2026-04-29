"use client"

import * as React from "react"

// Bumped from v1 → v2 because the CartItem shape gained `addOns` and
// the dedup key now folds add-on selections in (so two of the same
// variant with different patches stay as separate lines). v1 storage
// still parses correctly because add-ons are optional.
const STORAGE_KEY = "m90-cart-v2"
const STORAGE_KEY_LEGACY = "m90-cart-v1"

export interface CartAddOns {
  longSleeves: boolean
  patches: boolean
  /** Customer-provided name to print on the back. */
  playerName?: string
  /** Customer-provided number to print on the back. */
  playerNumber?: string
  /** Sum of the per-unit add-on prices, in USD. */
  total: number
}

export interface CartItem {
  variantId: string
  productId: string
  productSlug: string
  productName: string
  team: string
  number?: string
  size: string
  /** Base unit price — does NOT include add-ons. */
  unitPrice: number
  quantity: number
  primaryImageUrl?: string | null
  addOns?: CartAddOns
}

/**
 * Dedup key for cart lines. Same variantId with different add-ons
 * lives as separate lines; identical selections merge. Personalization
 * fields are part of the key so re-adding "Messi 10" doesn't collide
 * with a plain version of the same shirt.
 */
export function cartLineKey(item: Pick<CartItem, "variantId" | "addOns">): string {
  const a = item.addOns
  if (!a) return item.variantId
  return [
    item.variantId,
    a.longSleeves ? "ls" : "",
    a.patches ? "pt" : "",
    a.playerName ? `n=${a.playerName.toLowerCase().trim()}` : "",
    a.playerNumber ? `#${a.playerNumber.trim()}` : "",
  ]
    .filter(Boolean)
    .join("|")
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // One-time migration from v1 — same shape, just under a new key.
      raw = localStorage.getItem(STORAGE_KEY_LEGACY)
      if (raw) localStorage.setItem(STORAGE_KEY, raw)
    }
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (it): it is CartItem =>
        typeof it === "object" &&
        typeof it?.variantId === "string" &&
        typeof it?.quantity === "number",
    )
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("m90-cart-changed"))
}

export interface CartTotals {
  subtotal: number
  itemCount: number
}

export function computeTotals(items: CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (acc, it) => ({
      subtotal:
        acc.subtotal + (it.unitPrice + (it.addOns?.total ?? 0)) * it.quantity,
      itemCount: acc.itemCount + it.quantity,
    }),
    { subtotal: 0, itemCount: 0 },
  )
}

export function useCart() {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setItems(readCart())
    setHydrated(true)
    const handler = () => setItems(readCart())
    window.addEventListener("m90-cart-changed", handler)
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) handler()
    })
    return () => window.removeEventListener("m90-cart-changed", handler)
  }, [])

  const addItem = React.useCallback((item: CartItem) => {
    setItems((current) => {
      const key = cartLineKey(item)
      const existing = current.find((i) => cartLineKey(i) === key)
      const next = existing
        ? current.map((i) =>
            cartLineKey(i) === key
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          )
        : [...current, item]
      writeCart(next)
      return next
    })
  }, [])

  const updateQuantity = React.useCallback(
    (lineKey: string, quantity: number) => {
      setItems((current) => {
        const next = current
          .map((i) =>
            cartLineKey(i) === lineKey
              ? { ...i, quantity: Math.max(0, Math.min(20, quantity)) }
              : i,
          )
          .filter((i) => i.quantity > 0)
        writeCart(next)
        return next
      })
    },
    [],
  )

  const removeItem = React.useCallback((lineKey: string) => {
    setItems((current) => {
      const next = current.filter((i) => cartLineKey(i) !== lineKey)
      writeCart(next)
      return next
    })
  }, [])

  const clear = React.useCallback(() => {
    writeCart([])
    setItems([])
  }, [])

  const totals = React.useMemo(() => computeTotals(items), [items])

  return {
    items,
    totals,
    hydrated,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }
}
