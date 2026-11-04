import type { Metadata } from "next";
// Next.js processes this stylesheet import at build time.
// @ts-expect-error No TypeScript declarations are needed for CSS side-effect imports.
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkItDown Studio",
  description: "Convert documents into Markdown with Microsoft's MarkItDown.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
