"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  team: string;
  name: string;
  season: string;
  size: string;
  price: number;
  photo: string;
  qty: number;
};

type State = { items: CartItem[]; open: boolean };

type Action =
  | { type: "ADD"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "REMOVE"; id: string; size: string }
  | { type: "QTY"; id: string; size: string; qty: number }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "HYDRATE"; items: CartItem[] };

const STORAGE_KEY = "m90-cart-v1";
const key = (id: string, size: string) => `${id}::${size}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD": {
      const qty = action.qty ?? 1;
      const k = key(action.item.id, action.item.size);
      const idx = state.items.findIndex((i) => key(i.id, i.size) === k);
      let items: CartItem[];
      if (idx >= 0) {
        items = state.items.map((i, j) =>
          j === idx ? { ...i, qty: i.qty + qty } : i,
        );
      } else {
        items = [...state.items, { ...action.item, qty }];
      }
      return { ...state, items, open: true };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.id === action.id && i.size === action.size),
        ),
      };
    case "QTY":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.id && i.size === action.size
              ? { ...i, qty: Math.max(0, action.qty) }
              : i,
          )
          .filter((i) => i.qty > 0),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "OPEN":
      return { ...state, open: true };
    case "CLOSE":
      return { ...state, open: false };
    case "TOGGLE":
      return { ...state, open: !state.open };
    case "HYDRATE":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  count: number;
  total: number;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false });

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) dispatch({ type: "HYDRATE", items: parsed });
    } catch {
      // ignore parse errors — start fresh
    }
  }, []);

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items]);

  const value = useMemo<Ctx>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const total = state.items.reduce((s, i) => s + i.qty * i.price, 0);
    return { state, dispatch, count, total };
  }, [state]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
