import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dixit — a storytelling card game',
  description: 'A Dixit-style party game playable in your browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
