import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Energy-Task AI',
  description: 'Trợ lý ảo sắp xếp công việc dựa trên Deadline, Mức độ ưu tiên và Năng lượng cá nhân.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`${inter.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-50 font-sans antialiased selection:bg-indigo-500/30 min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
