import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AI Journal & Reflection',
  description: 'A secure personal AI journaling and reflection app with insights, summaries, and sentiment analysis.',
  openGraph: {
    title: 'AI Journal & Reflection',
    description: 'A secure personal AI journaling and reflection app with insights, summaries, and sentiment analysis.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Journal & Reflection',
    description: 'A secure personal AI journaling and reflection app with insights, summaries, and sentiment analysis.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
