import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Bubblegum_Sans, Comic_Neue, Noto_Sans_SC, ZCOOL_KuaiLe } from 'next/font/google'


export const revalidate = 600

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const bubblegum = Bubblegum_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bubblegum',
})

const comic = Comic_Neue({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-comic',
})

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-sc',
})

const zcoolKuaiLe = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zcool',
})

export const metadata: Metadata = {
  title: "我要记单词！",
  description: "一个旨在帮助你轻松记忆单词的网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${bubblegum.variable} ${comic.variable} ${notoSansSC.variable} ${zcoolKuaiLe.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
