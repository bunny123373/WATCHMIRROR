import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ContinueWatchingItem } from "@/types/content";

interface ContinueState {
  items: ContinueWatchingItem[];
}

const initialState: ContinueState = {
  items: []
};

const continueSlice = createSlice({
  name: "continue",
  initialState,
  reducers: {
    hydrateContinue(state, action: PayloadAction<ContinueWatchingItem[]>) {
      state.items = action.payload;
    },
    upsertContinue(state, action: PayloadAction<ContinueWatchingItem>) {
      const idx = state.items.findIndex((item) => {
        return (
          item.slug === action.payload.slug &&
          item.seasonNumber === action.payload.seasonNumber &&
          item.episodeNumber === action.payload.episodeNumber
        );
      });

      if (idx >= 0) {
        state.items[idx] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }

      state.items = state.items
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
    },
    removeContinue(state, action: PayloadAction<{ slug: string; seasonNumber?: number; episodeNumber?: number }>) {
      state.items = state.items.filter((item) => {
        return !(
          item.slug === action.payload.slug &&
          item.seasonNumber === action.payload.seasonNumber &&
          item.episodeNumber === action.payload.episodeNumber
        );
      });
    }
  }
});

export const { hydrateContinue, upsertContinue, removeContinue } = continueSlice.actions;
export default continueSlice.reducer;