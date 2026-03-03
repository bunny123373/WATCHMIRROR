import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/70 px-4 py-6 text-center text-sm text-muted">
      WATCHMIRROR {new Date().getFullYear()}
    </footer>
  );
}