import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/query-provider';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'ConcurseiroAI - IA para Estudos & Memorização',
  description: 'Plataforma de aprendizado ativo, RAG de editais, flashcards com repetição espaçada e simulados de bancas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
