import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const description =
  "A simpler way to plan and share your next ride around Dhaka.";

export const metadata: Metadata = {
  title: "Tesla Bullet | Get ready for your first trip",
  description,
  openGraph: {
    title: "Tesla Bullet | Get ready for your first trip",
    description,
    siteName: "Tesla Bullet",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
