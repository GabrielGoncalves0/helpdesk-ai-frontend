'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Bot, Sparkles, HelpCircle, GraduationCap, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Materiais & PDFs', href: '/materials', icon: FolderKanban },
  { label: 'Tutor IA & Mapa', href: '/tutor', icon: Bot },
  { label: 'Flashcards (Anki)', href: '/flashcards', icon: Sparkles },
  { label: 'Simulados Bancas', href: '/simulados', icon: HelpCircle },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  // If on login page, do not render header/navigation shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Concurseiro<span className="text-violet-400">AI</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Plataforma de Estudos & Memorização</p>
          </div>
        </div>

        {/* Desktop Header Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href} content={item.label} position="bottom">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </Tooltip>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                <Badge variant="purple" className="text-[10px] py-0">
                  {user.role === 'ADMIN' ? 'Plano VIP' : 'Estudante'}
                </Badge>
              </div>

              <Tooltip content="Encerrar Sessão" position="left">
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs ml-1">Sair</span>
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:hidden px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-all duration-150',
                isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-1', isActive && 'animate-pulse')} />
              <span className="text-[10px] truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
