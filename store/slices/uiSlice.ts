import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  mobileSearchOpen: boolean;
  searchTerm: string;
}

const initialState: UIState = {
  mobileSearchOpen: false,
  searchTerm: ""
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileSearchOpen(state, action: PayloadAction<boolean>) {
      state.mobileSearchOpen = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    }
  }
});

export const { setMobileSearchOpen, setSearchTerm } = uiSlice.actions;
export default uiSlice.reducer;