import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { TopNav } from "@/components/layout/top-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tokyo-kids-map.vercel.app"),
  title: {
    default: "东京溜娃地图 Tokyo Kids Map",
    template: "%s | 东京溜娃地图",
  },
  description:
    "面向在日华人家庭的东京亲子出行地图，快速筛选公园、图书馆、儿童馆、科学馆、雨天活动和放电地点。",
  keywords: [
    "东京溜娃",
    "Tokyo Kids Map",
    "东京亲子",
    "在日华人",
    "儿童公园",
    "雨天遛娃",
  ],
  openGraph: {
    title: "东京溜娃地图 Tokyo Kids Map",
    description: "帮 0-10 岁儿童家长快速找到东京适合带娃出行的地点。",
    locale: "zh_CN",
    siteName: "东京溜娃地图",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <TopNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
