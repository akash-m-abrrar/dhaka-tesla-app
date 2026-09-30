import { createSlice } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = { mode: "light" };

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
