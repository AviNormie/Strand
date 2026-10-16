import type { Metadata } from "next";
import {
  Caveat,
  Comic_Neue,
  Geist,
  Kalam,
  Patrick_Hand,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strand — AI Visibility Platform",
  description:
    "Strand tracks how AI discovers, understands, and recommends brands across every model and every conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${comicNeue.variable} ${patrickHand.variable} ${caveat.variable} ${kalam.variable} ${sourceSerif.variable} paper-grain antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
