import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "Silicon West | College Club & Event Management System",
  description: "Official Club & Event Discovery and Registration Portal for Silicon Institute of Technology (Silicon West Sambalpur Campus), Silicon University.",
  icons: {
    icon: 'https://silicon.ac.in/wp-content/themes/sit/favicon.ico',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-[#034694] selection:text-white font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
