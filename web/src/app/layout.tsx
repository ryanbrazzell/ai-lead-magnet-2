import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Montserrat } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/tracking/meta-pixel";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

// Montserrat as fallback for Helvetica Now Display (similar geometric sans-serif)
const montserrat = Montserrat({
  variable: "--font-nav",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Time Freedom Report | Assistant Launch",
  description: "Your personalized Time Freedom Report",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} ${montserrat.variable} antialiased`}
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
