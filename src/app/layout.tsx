import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LanguageProvider } from '@/context/LanguageContext';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

const bangla = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PothikVisa (পথিক ভিসা) — Indian Visa Application Automation',
  description:
    'Reliable automated Indian visa form filling for Bangladeshi travelers and agencies. Full 9-step automation, instant official PDF generation, and photo compliance.',
  keywords: [
    'Indian visa form fillup',
    'IVAC Bangladesh visa application',
    'Indian visa online Bangladesh',
    'Indian visa auto fill',
    'পথিক ভিসা',
    'PothikVisa',
    'IVAC appointment form',
    'Visa form automation Bangladesh',
  ],
  authors: [{ name: 'PothikVisa' }],
  openGraph: {
    title: 'PothikVisa (পথিক ভিসা) — Indian Visa Application Automation',
    description:
      'Complete all 9 steps of the Indian visa application in under a minute with zero session timeouts.',
    url: 'https://pothikvisa.com',
    siteName: 'PothikVisa',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${bangla.variable}`}>
        <body className="min-h-screen flex flex-col bg-white text-[#0A0A0A] font-sans antialiased vercel-grid">
          <LanguageProvider>
            <Navbar />
            <main role="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}