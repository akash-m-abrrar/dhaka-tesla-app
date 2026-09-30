import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/lib/features/auth/auth-slice";
import { themeReducer } from "@/lib/features/theme/theme-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
