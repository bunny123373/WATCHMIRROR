import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileSearchOverlay from "@/components/layout/MobileSearchOverlay";
import ContinueHydrator from "@/components/common/ContinueHydrator";

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
    icon: "/favicon.png"
  },
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
  return (
    <html lang="en">
      <body className="font-[var(--font-body)]">
        <ReduxProvider>
          <ContinueHydrator />
          <Navbar />
          <MobileSearchOverlay />
          <main className="mx-auto min-h-screen max-w-[1600px] px-4 pb-28 pt-24 md:px-8 md:pb-10">{children}</main>
          <Footer />
          <MobileBottomNav />
        </ReduxProvider>
      </body>
    </html>
  );
}
