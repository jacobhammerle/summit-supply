export type Product = {
  id: string;
  name: string;
  price: number;
  blurb: string;
  emoji: string;
};

// Static catalog. No network calls. Deterministic for agent runs.
export const PRODUCTS: Product[] = [
  {
    id: "ridgeline-tent-2",
    name: "Ridgeline Tent (2P)",
    price: 289,
    blurb: "Freestanding two-person tent. 1.9 kg trail weight.",
    emoji: "⛺",
  },
  {
    id: "cascade-shell",
    name: "Cascade Rain Shell",
    price: 149,
    blurb: "3-layer waterproof shell with pit zips.",
    emoji: "🧥",
  },
  {
    id: "granite-pack-45",
    name: "Granite Pack 45L",
    price: 179,
    blurb: "Framed pack for 3-day loads. Hip-belt pockets.",
    emoji: "🎒",
  },
  {
    id: "ember-stove",
    name: "Ember Canister Stove",
    price: 54,
    blurb: "Boils 1L in 3.5 minutes. 88 g.",
    emoji: "🔥",
  },
  {
    id: "switchback-poles",
    name: "Switchback Trekking Poles",
    price: 89,
    blurb: "Carbon poles, folding, 38 cm packed.",
    emoji: "🥾",
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
