'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface Subscription {
  status: string;
  daysRemaining: number | null;
  currentPeriodEnd: string;
}

interface HeaderProps {
  subscription?: Subscription | null;
}

export default function Header({ subscription }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Competitors', href: '/dashboard/competitors', icon: '👥' },
    { label: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
    { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-2 md:py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex-shrink-0">
              <Image
                src="/logo_transparent.png"
                alt="MarketPulse"
                width={500}
                height={125}
                className="h-40 md:h-32 lg:h-40 xl:h-48 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 mx-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="relative flex items-center gap-2 sm:gap-4">
              {/* User Info (Hidden on small mobile) */}
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-600">
                  {subscription?.status === 'trialing' && 'On Trial'}
                  {subscription?.status === 'active' && 'Active'}
                  {subscription?.status === 'past_due' && 'Past Due'}
                  {!subscription && 'Free'}
                </p>
              </div>

              {/* Desktop User Dropdown */}
              <div className="relative hidden md:block group">
                <button className="px-3 lg:px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2">
                  Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                    Profile Settings
                  </Link>
                  <Link href="/dashboard/business" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Business Settings
                  </Link>
                  <Link href="/dashboard/security" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Security
                  </Link>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Mobile Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="md:hidden px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-bottom z-40">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-2 text-[10px] sm:text-xs font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="text-base sm:text-lg mb-0.5">{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
