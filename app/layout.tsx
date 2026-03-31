import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import Navbar from "@/components/layout/Navbar";
import ProfileGate from "@/components/providers/profile-gate";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileSearchOverlay from "@/components/layout/MobileSearchOverlay";
import AppShell from "@/components/layout/AppShell";
import ContinueHydrator from "@/components/common/ContinueHydrator";
import MyListHydrator from "@/components/common/MyListHydrator";
import ServiceWorkerRegister from "@/components/providers/sw-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://watchmirror.vercel.app"),
  alternates: {
    canonical: "/"
  },
  title: {
    default: "WATCHMIRROR - Stream Without Limits.",
    template: "%s | WATCHMIRROR"
  },
  icons: {
    icon: "/favicon1.png"
  },
  manifest: "/manifest.webmanifest",
  description: "WATCHMIRROR is a premium OTT movie and web series streaming platform.",
  openGraph: {
    title: "WATCHMIRROR",
    description: "Stream Without Limits.",
    siteName: "WATCHMIRROR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "WATCHMIRROR",
    description: "Stream Without Limits.",
    site: "WATCHMIRROR"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const playerjsUrl = process.env.NEXT_PUBLIC_PLAYERJS_URL;
  
  return (
    <html lang="en">
      <head>
        {playerjsUrl && (
          <Script
            src={playerjsUrl}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="flex min-h-screen flex-col bg-[#141414] font-[var(--font-body)] antialiased">
        <ReduxProvider>
          <AuthProvider>
            <ContinueHydrator />
            <MyListHydrator />
            <ServiceWorkerRegister />
            <Navbar />
            <MobileSearchOverlay />
            <ProfileGate>
              <AppShell>{children}</AppShell>
            </ProfileGate>
            <Footer />
            <MobileBottomNav />
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
