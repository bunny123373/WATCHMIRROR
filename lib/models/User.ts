import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IProfile {
  name: string;
  avatar: string;
}

export interface IUser {
  email: string;
  password: string;
  profiles: IProfile[];
  myList: string[];
  watchHistory: { contentId: string; progress: number; updatedAt: Date }[];
  createdAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: "user" }
  },
  { _id: false }
);

const watchHistoryItemSchema = new Schema(
  {
    contentId: { type: String, required: true },
    progress: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    profiles: { type: [profileSchema], default: [{ name: "You", avatar: "user" }] },
    myList: { type: [String], default: [] },
    watchHistory: { type: [watchHistoryItemSchema], default: [] }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = models.User || model("User", userSchema);
