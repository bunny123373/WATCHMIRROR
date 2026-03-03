"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "watchmirror_profile";
const defaultProfiles = ["You", "Family", "Kids"];
const palette = ["#E50914", "#0071EB", "#B81D24", "#3A3A3A", "#E87C03"];

export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string>("");
  const [profiles, setProfiles] = useState<string[]>(defaultProfiles);
  const [newProfile, setNewProfile] = useState("");

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(STORAGE_KEY) || "";
    const rawProfiles = window.localStorage.getItem(`${STORAGE_KEY}_list`);
    if (rawProfiles) {
      try {
        const parsed = JSON.parse(rawProfiles);
        if (Array.isArray(parsed) && parsed.length) setProfiles(parsed);
      } catch {
        // ignore
      }
    }
    if (rawProfile) setSelected(rawProfile);
  }, []);

  const activeProfiles = useMemo(() => profiles.filter(Boolean), [profiles]);

  const chooseProfile = (name: string) => {
    setSelected(name);
    window.localStorage.setItem(STORAGE_KEY, name);
    window.localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(activeProfiles));
  };

  const addProfile = () => {
    const name = newProfile.trim();
    if (!name || activeProfiles.includes(name)) return;
    const next = [...activeProfiles, name].slice(0, 6);
    setProfiles(next);
    setNewProfile("");
    window.localStorage.setItem(`${STORAGE_KEY}_list`, JSON.stringify(next));
  };

  if (!selected) {
    return (
      <div className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center bg-[#141414] px-4">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h1 className="font-[var(--font-heading)] text-5xl text-white">Who&apos;s Watching?</h1>
          <div className="grid gap-4 sm:grid-cols-3">
            {activeProfiles.map((name, idx) => (
              <button
                key={name}
                onClick={() => chooseProfile(name)}
                className="group rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 transition hover:border-white"
              >
                <div
                  className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-lg text-2xl font-bold text-white"
                  style={{ backgroundColor: palette[idx % palette.length] }}
                >
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <p className="text-sm text-[#d4d4d4]">{name}</p>
              </button>
            ))}
          </div>
          <div className="mx-auto flex max-w-md gap-2">
            <input
              value={newProfile}
              onChange={(e) => setNewProfile(e.target.value)}
              placeholder="Add profile"
              className="flex-1 rounded-md border border-[#2A2A2A] bg-[#181818] px-4 py-2 text-sm text-white"
            />
            <button type="button" onClick={addProfile} className="rounded-md bg-[#E50914] px-4 py-2 text-sm font-semibold text-white">
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
