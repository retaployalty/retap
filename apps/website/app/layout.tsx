import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "ReTap - Loyalty made simple for business",
  description: "One NFC card for all your favorite shops. Earn points everywhere you go with ReTap.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body
        className={`${fredoka.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
