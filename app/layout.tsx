import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Global Public Adjusters - Contractor Network Management",
    template: "%s | Global Public Adjusters",
  },
  description:
    "Professional contractor network and referral management system for Global Public Adjusters. Manage vendors, claims, follow-ups, and administrative tasks with comprehensive role-based access control.",
  keywords:
    "public adjusters, contractor network, vendor management, claims management, referral system, Florida adjusters, insurance claims, contractor referrals",
  authors: [{ name: "Global Public Adjusters" }],
  creator: "Global Public Adjusters",
  publisher: "Global Public Adjusters",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://globaladjustersfla.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Global Public Adjusters - Contractor Network Management",
    description:
      "Professional contractor network and referral management system for Global Public Adjusters. Manage vendors, claims, and administrative tasks.",
    url: "https://globaladjustersfla.com",
    siteName: "Global Public Adjusters",
    images: [
      {
        url: "https://imagedelivery.net/evaK9kznBmXiy6yXsaBusQ/758bd470-7d38-4600-99b3-2c3ba24c9a00/public",
        width: 1200,
        height: 630,
        alt: "Global Public Adjusters Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Public Adjusters - Contractor Network Management",
    description: "Professional contractor network and referral management system for Global Public Adjusters.",
    images: ["https://imagedelivery.net/evaK9kznBmXiy6yXsaBusQ/758bd470-7d38-4600-99b3-2c3ba24c9a00/public"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
