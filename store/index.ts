import { configureStore } from "@reduxjs/toolkit";
import continueReducer from "@/store/slices/continueSlice";
import uiReducer from "@/store/slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      continue: continueReducer,
      ui: uiReducer
    }
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];