import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { DatabaseErrorModal } from '@/components/DatabaseErrorModal';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'SkillSwap | Decentralized Knowledge Exchange & Virtual Barter Economy',
  description: 'Trade skills instead of money using our secure escrow logic.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
            <DatabaseErrorModal />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
