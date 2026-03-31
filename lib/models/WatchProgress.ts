import { Schema, model, models } from "mongoose";

const watchProgressSchema = new Schema(
  {
    profileName: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    type: { type: String, enum: ["movie", "series"], required: true },
    title: { type: String, required: true },
    poster: { type: String, default: "" },
    currentTime: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
    seasonNumber: { type: Number, default: null },
    episodeNumber: { type: Number, default: null }
  },
  { timestamps: true }
);

watchProgressSchema.index(
  { profileName: 1, slug: 1, seasonNumber: 1, episodeNumber: 1 },
  { unique: true, name: "profile_content_progress_unique" }
);

export const WatchProgressModel = models.WatchProgress || model("WatchProgress", watchProgressSchema);
