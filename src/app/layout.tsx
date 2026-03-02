import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vision3 - 未来から逆算して今日を設計する",
  description: "夢を入力すると、AIが今日やるべき具体的な行動を3つ提案。完了すると次の一歩を提案し続ける行動設計アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#09090b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter] bg-[#09090b] md:bg-zinc-900 text-white flex justify-center items-center h-[100dvh] overflow-hidden">
        {/* Mobile Frame Container */}
        <div className="w-full max-w-[430px] h-full md:h-[92vh] bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border-x border-zinc-800/50 overflow-hidden md:rounded-[3rem] md:border-4 md:border-zinc-800/80">
          {/* Subtle reflection/gradient overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] to-transparent z-50 rounded-[inherit]" />
          <div className="relative h-full flex flex-col overflow-hidden">
            <main className="flex-1 overflow-hidden relative z-10">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
