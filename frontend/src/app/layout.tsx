import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header';
import { Providers } from "./providers"; // --- NEW: Import our client-side provider
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
    // The <html> tag is now the outermost element
    <html lang="en">
      <body className={`${inter.className}`}>
        {/* The Providers component wraps the content INSIDE the body */}
        <Providers>
          <Header />
          <main className="container mx-auto p-4 md:p-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}