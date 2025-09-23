import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from './components/Header';
import { AuthProvider } from '../contexts/AuthContext'; 
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
        <AuthProvider>
          <Header />
          <main className="container mx-auto p-4 md:p-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}