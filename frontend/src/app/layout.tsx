import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header';
import "./globals.css";
import getConfig from 'next/config'; // --- NEW: Import getConfig

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crisma Management App",
  description: "Centralized information for crisma participants and groups",
};

// --- NEW: Get the public runtime config ---
const { publicRuntimeConfig } = getConfig();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --- THIS IS THE FIX ---
    // We pass the key explicitly from the runtime config.
    // The `publishableKey` prop DOES exist, the `secretKey` one did not.
    <ClerkProvider
      publishableKey={publicRuntimeConfig.clerkPublishableKey}
    >
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}