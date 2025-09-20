import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
    <html lang="en">
      <body className={`${inter.className}`}>
        <header className="bg-white dark:bg-gray-800/50 shadow-md backdrop-blur-sm sticky top-0 z-40">
          <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              Crisma App
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                Participants
              </Link>
              <Link href="/catechists" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                Catechists
              </Link>
              <Link href="/groups" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                Groups
              </Link>
            </div>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}