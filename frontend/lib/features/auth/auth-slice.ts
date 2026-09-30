import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export type AuthStatus = "initializing" | "unauthenticated" | "authenticated";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  status: "initializing",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    refreshTokenRestored(state, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
      state.status = "initializing";
    },
    sessionEstablished(state, action: PayloadAction<SessionTokens>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.status = "authenticated";
    },
    sessionInitializationFinished(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "unauthenticated";
    },
    sessionCleared(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "unauthenticated";
    },
  },
});

export const {
  refreshTokenRestored,
  sessionEstablished,
  sessionInitializationFinished,
  sessionCleared,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
