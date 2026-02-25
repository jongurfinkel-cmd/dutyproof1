import type { Metadata } from "next";
import { Geist, Syne } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dutyproof.com'),
  title: {
    default: 'DutyProof — Fire Watch Compliance Software',
    template: '%s | DutyProof',
  },
  description:
    'Fire watch verification software for welding, pipefitting, and mechanical contractors. SMS check-ins every 15–30 minutes, tamper-proof audit logs, and one-click OSHA-ready PDF reports. Start a 60-day free trial.',
  keywords: [
    'fire watch verification software',
    'hot work fire watch software',
    'OSHA fire watch compliance',
    'NFPA 51B fire watch',
    'welding fire watch log software',
    'fire watch SMS check-in',
    'contractor fire watch documentation',
    'fire watch audit log',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dutyproof.com',
    siteName: 'DutyProof',
    title: 'DutyProof — Fire Watch Verification Software',
    description:
      'Stop pencil-whipping your fire watch logs. Automated SMS check-ins, tamper-proof audit logs, and OSHA-ready PDF reports for hot work contractors.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DutyProof — Fire Watch Verification Software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DutyProof — Fire Watch Verification Software',
    description:
      'Stop pencil-whipping your fire watch logs. Automated SMS check-ins, tamper-proof audit logs, and OSHA-ready PDF reports for hot work contractors.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${syne.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px' },
          }}
        />
      </body>
    </html>
  );
}
