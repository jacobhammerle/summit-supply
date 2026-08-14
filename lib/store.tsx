import React, { createContext, useContext, useMemo, useRef, useState } from "react";

// ---- Types ----------------------------------------------------------------

export type CartItem = { productId: string; qty: number };

export type Settings = {
  units: "imperial" | "metric";
  notifications: boolean;
  tripReminders: boolean;
};

export type TrailLog = {
  id: string;
  title: string;
  status: "pending" | "synced";
};

type Store = {
  // Cart / checkout
  cart: CartItem[];
  addToCart: (productId: string) => void;
  clearCart: () => void;
  lastOrderId: string | null;
  placeOrder: () => string;

  // Settings
  settings: Settings;
  setSettings: (s: Settings) => void;
  settingsSavedAt: string | null;
  markSettingsSaved: () => void;

  // Offline sync
  online: boolean;
  setOnline: (v: boolean) => void;
  logs: TrailLog[];
  addLog: () => void;
  syncLogs: () => void;
};

// ---- Context ---------------------------------------------------------------

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>({
    units: "imperial",
    notifications: true,
    tripReminders: false,
  });
  const [settingsSavedAt, setSettingsSavedAt] = useState<string | null>(null);

  const [online, setOnline] = useState(true);
  const [logs, setLogs] = useState<TrailLog[]>([]);
  const logCounter = useRef(0);
  const orderCounter = useRef(1041); // first order becomes SS-1042

  const addToCart = (productId: string) =>
    setCart((prev) => {
      const found = prev.find((c) => c.productId === productId);
      if (found) {
        return prev.map((c) =>
          c.productId === productId ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { productId, qty: 1 }];
    });

  const clearCart = () => setCart([]);

  const placeOrder = () => {
    orderCounter.current += 1;
    const id = `SS-${orderCounter.current}`;
    setLastOrderId(id);
    setCart([]);
    return id;
  };

  const markSettingsSaved = () =>
    setSettingsSavedAt(new Date().toISOString());

  const addLog = () => {
    logCounter.current += 1;
    const n = logCounter.current;
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${n}`,
        title: `Trail log ${n}`,
        status: online ? "synced" : "pending",
      },
    ]);
  };

  const syncLogs = () =>
    setLogs((prev) => prev.map((l) => ({ ...l, status: "synced" })));

  const value = useMemo<Store>(
    () => ({
      cart,
      addToCart,
      clearCart,
      lastOrderId,
      placeOrder,
      settings,
      setSettings,
      settingsSavedAt,
      markSettingsSaved,
      online,
      setOnline,
      logs,
      addLog,
      syncLogs,
    }),
    [cart, lastOrderId, settings, settingsSavedAt, online, logs]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
