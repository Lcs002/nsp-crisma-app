import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header'; // Import our new Header component
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
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header /> {/* Use the Header component here */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}