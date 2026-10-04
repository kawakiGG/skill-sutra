import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skill Sutra - AI Labour Market Intelligence",
  description: "AI-enabled labour market intelligence and skill demand-supply forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased flex flex-col`}>
        <AppProvider>
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
