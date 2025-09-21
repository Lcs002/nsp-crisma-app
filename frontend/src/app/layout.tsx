import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header';
import "./globals.css";
import { publishableKey } from '../clerk.config'; // --- IMPORT THE KEY FROM OUR FILE ---

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crisma Management App",
  description: "Centralized information for crisma participants and groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --- THIS IS THE DEFINITIVE FIX ---
    // We pass the key directly from our configuration file.
    // There is no more dependency on a Vercel environment variable at build time.
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header />
          <main className="container mx-auto p-4 md:p-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}