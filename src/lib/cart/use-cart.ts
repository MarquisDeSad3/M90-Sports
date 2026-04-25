"use client"

import * as React from "react"

const STORAGE_KEY = "m90-cart-v1"

export interface CartItem {
  variantId: string
  productId: string
  productSlug: string
  productName: string
  team: string
  number?: string
  size: string
  unitPrice: number
  quantity: number
  primaryImageUrl?: string | null
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (it): it is CartItem =>
        typeof it === "object" &&
        typeof it?.variantId === "string" &&
        typeof it?.quantity === "number"
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
      subtotal: acc.subtotal + it.unitPrice * it.quantity,
      itemCount: acc.itemCount + it.quantity,
    }),
    { subtotal: 0, itemCount: 0 }
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
      const existing = current.find((i) => i.variantId === item.variantId)
      const next = existing
        ? current.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        : [...current, item]
      writeCart(next)
      return next
    })
  }, [])

  const updateQuantity = React.useCallback(
    (variantId: string, quantity: number) => {
      setItems((current) => {
        const next = current
          .map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.max(0, Math.min(20, quantity)) }
              : i
          )
          .filter((i) => i.quantity > 0)
        writeCart(next)
        return next
      })
    },
    []
  )

  const removeItem = React.useCallback((variantId: string) => {
    setItems((current) => {
      const next = current.filter((i) => i.variantId !== variantId)
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
