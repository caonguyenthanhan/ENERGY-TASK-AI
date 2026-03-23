import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AppWrapper from "@/components/AppWrapper";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
