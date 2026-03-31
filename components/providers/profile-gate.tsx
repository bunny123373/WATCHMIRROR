"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

const STORAGE_KEY = "watchmirror_profile";

type Profile = {
  name: string;
  avatar: string;
};

const defaultProfiles: Profile[] = [
  { name: "You", avatar: "user" },
  { name: "Family", avatar: "home" },
  { name: "Kids", avatar: "star" },
];

const avatarOptions = [
  { id: "user", emoji: "👤", label: "User" },
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "heart", emoji: "❤️", label: "Heart" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "bolt", emoji: "⚡", label: "Bolt" },
  { id: "moon", emoji: "🌙", label: "Moon" },
  { id: "sun", emoji: "☀️", label: "Sun" },
  { id: "rainbow", emoji: "🌈", label: "Rainbow" },
  { id: "gem", emoji: "💎", label: "Gem" },
  { id: "crown", emoji: "👑", label: "Crown" },
  { id: "rocket", emoji: "🚀", label: "Rocket" },
];

const palette = ["#E50914", "#0071EB", "#B81D24", "#3A3A3A", "#E87C03"];

function getAvatarEmoji(avatarId: string): string {
  const avatar = avatarOptions.find((a) => a.id === avatarId);
  return avatar?.emoji || "👤";
}

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [selected, setSelected] = useState<string>("");
  const [profiles, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("user");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!loading && user?.profiles) {
      setProfiles(user.profiles);
      const rawProfile = window.localStorage.getItem(STORAGE_KEY) || "";
      if (rawProfile && user.profiles.some(p => p.name === rawProfile)) {
        setSelected(rawProfile);
      }
    } else if (!loading && !user) {
      const rawProfile = window.localStorage.getItem(STORAGE_KEY) || "";
      const rawProfiles = window.localStorage.getItem(`${STORAGE_KEY}_list`);
      if (rawProfiles) {
        try {
          const parsed = JSON.parse(rawProfiles);
          if (Array.isArray(parsed) && parsed.length) setProfiles(parsed);
        } catch {
        }
      }
      if (rawProfile) setSelected(rawProfile);
    }
  }, [loading, user]);

  const activeProfiles = useMemo(() => profiles.filter((p) => p.name && p.avatar), [profiles]);

  const chooseProfile = (name: string) => {
    setSelected(name);
    window.localStorage.setItem(STORAGE_KEY, name);
    window.localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(activeProfiles));
  };

  const addProfile = () => {
    const name = newProfileName.trim();
    if (!name || activeProfiles.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    const next = [...activeProfiles, { name, avatar: newProfileAvatar }].slice(0, 6);
    setProfiles(next);
    setNewProfileName("");
    setNewProfileAvatar("user");
    setShowAddForm(false);
    window.localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(next));
  };

  const deleteProfile = (name: string) => {
    const next = activeProfiles.filter((p) => p.name !== name);
    setProfiles(next);
    if (selected === name) {
      setSelected("");
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(next));
  };

  if (loading) {
    return null;
  }

  if (!user && !selected) {
    return (
      <div className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center bg-[#141414] px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="font-[var(--font-heading)] text-5xl text-white">WATCHMIRROR</h1>
          <p className="text-gray-400">Sign in to save your profiles, my list, and watch history</p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-[#E50914] py-3 text-white transition hover:bg-[#b81d24]"
            >
              Sign In
            </Link>
            <button
              onClick={() => setSelected("guest")}
              className="block w-full rounded-lg border border-dashed border-white/20 py-3 text-gray-400 transition hover:text-white"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selected && !user) {
    return (
      <div className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center bg-[#141414] px-4">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h1 className="font-[var(--font-heading)] text-5xl text-white">Who&apos;s Watching?</h1>
          <div className="grid gap-4 sm:grid-cols-3">
            {activeProfiles.map((profile, idx) => (
              <div key={profile.name} className="relative group">
                <button
                  onClick={() => chooseProfile(profile.name)}
                  className="w-full rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 transition hover:border-white"
                >
                  <div
                    className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
                    style={{ backgroundColor: palette[idx % palette.length] }}
                  >
                    {getAvatarEmoji(profile.avatar)}
                  </div>
                  <p className="text-sm text-[#d4d4d4]">{profile.name}</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProfile(profile.name);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-[#2A2A2A] p-1.5 text-xs text-gray-400 opacity-0 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
                  title="Delete profile"
                >
                  ✕
                </button>
              </div>
            ))}
            {activeProfiles.length < 6 && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-xl border border-dashed border-[#2A2A2A] bg-transparent p-4 transition hover:border-white hover:bg-[#181818]"
              >
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#2A2A2A] text-3xl text-[#666]">
                  +
                </div>
                <p className="text-sm text-[#666]">Add Profile</p>
              </button>
            )}
          </div>
          {showAddForm && (
            <div className="mx-auto flex max-w-md flex-col gap-4 rounded-xl border border-[#2A2A2A] bg-[#181818] p-6">
              <input
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profile name"
                maxLength={20}
                className="w-full rounded-md border border-[#2A2A2A] bg-[#141414] px-4 py-2 text-sm text-white placeholder:text-gray-500"
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Choose an avatar</p>
                <div className="grid grid-cols-6 gap-2">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setNewProfileAvatar(avatar.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition ${
                        newProfileAvatar === avatar.id
                          ? "bg-[#E50914] ring-2 ring-white"
                          : "bg-[#2A2A2A] hover:bg-[#3A3A3A]"
                      }`}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addProfile}
                  disabled={!newProfileName.trim()}
                  className="flex-1 rounded-md bg-[#E50914] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81d24] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewProfileName("");
                    setNewProfileAvatar("user");
                  }}
                  className="rounded-md border border-[#2A2A2A] px-4 py-2 text-sm text-gray-400 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
