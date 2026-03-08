import { Schema, model, models } from "mongoose";

const castSchema = new Schema(
  {
    name: { type: String, required: true },
    character: { type: String, required: true },
    profileImage: { type: String, default: "" }
  },
  { _id: false }
);

const subtitleTrackSchema = new Schema(
  {
    label: { type: String, required: true },
    lang: { type: String, required: true },
    url: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const episodeSchema = new Schema(
  {
    episodeNumber: { type: Number, required: true },
    episodeTitle: { type: String, required: true },
    hlsLink: { type: String, default: "" },
    embedIframeLink: { type: String, default: "" },
    backupHlsLink: { type: String, default: "" },
    backupEmbedIframeLink: { type: String, default: "" },
    subtitleTracks: { type: [subtitleTrackSchema], default: [] },
    releaseAt: { type: Date, default: null },
    quality: { type: String, default: "" }
  },
  { _id: false }
);

const seasonSchema = new Schema(
  {
    seasonNumber: { type: Number, required: true },
    episodes: { type: [episodeSchema], default: [] }
  },
  { _id: false }
);

const contentSchema = new Schema(
  {
    type: { type: String, enum: ["movie", "series"], required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    poster: { type: String, required: true },
    banner: { type: String, required: true },
    description: { type: String, required: true },
    year: { type: Number, required: true },
    language: { type: String, default: "English" },
    audioLanguages: { type: [String], default: [] },
    category: { type: String, default: "General" },
    quality: { type: String, default: "HD" },
    rating: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    popularity: { type: Number, default: 0 },
    trailerEmbedUrl: { type: String, default: "" },
    cast: { type: [castSchema], default: [] },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    hlsLink: { type: String, default: "" },
    embedIframeLink: { type: String, default: "" },
    backupHlsLink: { type: String, default: "" },
    backupEmbedIframeLink: { type: String, default: "" },
    subtitleTracks: { type: [subtitleTrackSchema], default: [] },
    downloadLink: { type: String, default: "" },
    publishAt: { type: Date, default: null },
    seasons: { type: [seasonSchema], default: [] }
  },
  { timestamps: true }
);

contentSchema.index({ type: 1, popularity: -1, createdAt: -1 });
contentSchema.index({ type: 1, rating: -1 });
contentSchema.index({ publishAt: 1, createdAt: -1 });
contentSchema.index({ category: 1, type: 1, popularity: -1 });
contentSchema.index({ language: 1, type: 1, popularity: -1 });
contentSchema.index({ tags: 1, type: 1, popularity: -1 });

export const ContentModel = models.Content || model("Content", contentSchema);
