// src/stores/useFilterStore.ts
"use client";

import { create } from "zustand";

type Gender = "male" | "female" | null;

interface FilterState {
  gender: Gender;
  colors: string[];
  sort: string;
  setGender: (gender: Gender) => void;
  toggleColor: (color: string) => void;
  setSort: (sort: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  gender: null,
  colors: [],
  sort: "createdAt_desc",
  setGender: (gender) => set({ gender }),
  toggleColor: (color) =>
    set((state) => ({
      colors: state.colors.includes(color)
        ? state.colors.filter((c) => c !== color)
        : [...state.colors, color],
    })),
  setSort: (sort) => set({ sort }),
  reset: () => set({ gender: null, colors: [], sort: "createdAt_desc" }),
}));
