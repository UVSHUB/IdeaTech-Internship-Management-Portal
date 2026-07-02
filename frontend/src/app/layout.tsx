import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IdeaTech Internship Management Portal (ITIMP)",
  description: "Enterprise WFH Internship lifecycle management, automated warning policies, digital logbooks, certificates and gamified performance trackers for IdeaTech (PVT) LTD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
              {/* Background ambient neon glow circles */}
              <div className="absolute top-[-10%] left-[-10%] glow-spot-blue"></div>
              <div className="absolute bottom-[-10%] right-[-10%] glow-spot-purple"></div>
              
              <div className="relative z-10">
                {children}
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
