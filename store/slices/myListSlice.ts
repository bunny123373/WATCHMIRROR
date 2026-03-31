import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyListItem } from "@/types/content";

interface MyListState {
  items: MyListItem[];
}

const initialState: MyListState = {
  items: []
};

const myListSlice = createSlice({
  name: "myList",
  initialState,
  reducers: {
    hydrateMyList(state, action: PayloadAction<MyListItem[]>) {
      state.items = action.payload;
    },
    toggleMyList(state, action: PayloadAction<MyListItem>) {
      const exists = state.items.some((item) => item.slug === action.payload.slug && item.type === action.payload.type);
      if (exists) {
        state.items = state.items.filter((item) => !(item.slug === action.payload.slug && item.type === action.payload.type));
      } else {
        state.items.unshift(action.payload);
      }
    },
    removeMyList(state, action: PayloadAction<{ slug: string; type: "movie" | "series" }>) {
      state.items = state.items.filter((item) => !(item.slug === action.payload.slug && item.type === action.payload.type));
    }
  }
});

export const { hydrateMyList, toggleMyList, removeMyList } = myListSlice.actions;
export default myListSlice.reducer;
