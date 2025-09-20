import { ClerkProvider, UserButton } from '@clerk/nextjs';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header';
import "./globals.css";

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
    // --- THIS IS THE FIX ---
    // We are now explicitly passing the environment variables as props to the provider.
    // This ensures they are available during the server-side build process.
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
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