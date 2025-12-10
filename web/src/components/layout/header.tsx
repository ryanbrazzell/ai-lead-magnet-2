/**
 * Header Component
 *
 * Header with logo and navigation
 * - Navy background (#0f172a)
 * - Montserrat font (fallback for Helvetica Now Display)
 * - Gold accent color (#f59e0b)
 * - Dropdown menu for "About" section
 */

"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown } from 'lucide-react';

export interface HeaderProps {
  /**
   * Logo content - can be a React node or image src string
   */
  logo?: React.ReactNode | string;

  /**
   * Optional href to make the logo clickable
   */
  href?: string;

  /**
   * Whether to show navigation links (default: true)
   */
  showNav?: boolean;

  /**
   * Additional className to merge with default styles
   */
  className?: string;

  /**
   * Current active page path for highlighting
   */
  activePath?: string;
}

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

const navLinks: NavLink[] = [
  { label: 'Home', href: 'https://www.assistantlaunch.com/' },
  {
    label: 'About',
    href: '#',
    children: [
      { label: 'What We Do', href: 'https://www.assistantlaunch.com/what-we-do' },
      { label: 'FAQs', href: 'https://www.assistantlaunch.com/faq' },
    ]
  },
  { label: 'Services', href: 'https://www.assistantlaunch.com/services' },
  { label: 'Success Stories', href: 'https://www.assistantlaunch.com/success-stories' },
];

function LogoContent({ logo }: { logo?: React.ReactNode | string }) {
  if (!logo) {
    return (
      <span
        className="text-xl font-bold text-white tracking-wider"
        style={{ fontFamily: 'var(--font-nav), Montserrat, sans-serif' }}
      >
        Assistant Launch
      </span>
    );
  }

  if (typeof logo === 'string') {
    return (
      <img
        src={logo}
        alt="Assistant Launch"
        className="h-8 md:h-10 w-auto object-contain"
      />
    );
  }

  return <>{logo}</>;
}

function DropdownMenu({
  items,
  isOpen,
  onClose
}: {
  items: NavLink[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 mt-2 py-2 min-w-[160px] bg-black/80 backdrop-blur-sm rounded-md shadow-lg z-50"
      onMouseLeave={onClose}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="block px-4 py-2 text-white hover:text-[#f59e0b] transition-colors"
          style={{
            fontFamily: 'var(--font-nav), Montserrat, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function Header({ logo, href, showNav = true, className, activePath }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const logoContent = <LogoContent logo={logo} />;

  const isActive = (linkHref: string) => {
    if (!activePath) return false;
    return activePath === linkHref || linkHref.endsWith(activePath);
  };

  return (
    <header
      className={cn(
        'w-full',
        'bg-[#0f172a]',
        'px-4 md:px-6',
        'py-2 md:py-4',
        'relative z-50',
        className
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        {href ? (
          <a
            href={href}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm transition-opacity hover:opacity-90"
            aria-label="Go to homepage"
          >
            {logoContent}
          </a>
        ) : (
          <a
            href="https://www.assistantlaunch.com/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm transition-opacity hover:opacity-90"
            aria-label="Go to homepage"
          >
            {logoContent}
          </a>
        )}

        {/* Desktop Navigation */}
        {showNav && (
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.children ? (
                  // Dropdown trigger
                  <button
                    className={cn(
                      "flex items-center gap-1 transition-colors px-3 py-2",
                      isActive(link.href) ? "text-[#f59e0b]" : "text-white hover:text-[#f59e0b]"
                    )}
                    style={{
                      fontFamily: 'var(--font-nav), Montserrat, sans-serif',
                      fontSize: '18px',
                      fontWeight: 400,
                    }}
                    aria-expanded={openDropdown === link.label}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        openDropdown === link.label && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  // Regular link
                  <a
                    href={link.href}
                    className={cn(
                      "transition-colors px-3 py-2 block",
                      isActive(link.href) ? "text-[#f59e0b]" : "text-white hover:text-[#f59e0b]"
                    )}
                    style={{
                      fontFamily: 'var(--font-nav), Montserrat, sans-serif',
                      fontSize: '18px',
                      fontWeight: 400,
                    }}
                  >
                    {link.label}
                  </a>
                )}

                {/* Dropdown menu */}
                {link.children && (
                  <DropdownMenu
                    items={link.children}
                    isOpen={openDropdown === link.label}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>
            ))}

          </nav>
        )}

        {/* Mobile Menu Button */}
        {showNav && (
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Navigation */}
      {showNav && mobileMenuOpen && (
        <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 bg-black/80 backdrop-blur-sm rounded-lg mx-2 px-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <React.Fragment key={link.label}>
                {link.children ? (
                  // Mobile dropdown section
                  <div className="py-2">
                    <span
                      className="text-white/60 uppercase text-sm tracking-wider"
                      style={{ fontFamily: 'var(--font-nav), Montserrat, sans-serif' }}
                    >
                      {link.label}
                    </span>
                    <div className="mt-2 ml-4 flex flex-col gap-2">
                      {link.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="text-white hover:text-[#f59e0b] transition-colors"
                          style={{
                            fontFamily: 'var(--font-nav), Montserrat, sans-serif',
                            fontSize: '16px',
                            fontWeight: 400,
                          }}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Regular mobile link
                  <a
                    href={link.href}
                    className={cn(
                      "py-2 transition-colors",
                      isActive(link.href) ? "text-[#f59e0b]" : "text-white hover:text-[#f59e0b]"
                    )}
                    style={{
                      fontFamily: 'var(--font-nav), Montserrat, sans-serif',
                      fontSize: '18px',
                      fontWeight: 400,
                    }}
                  >
                    {link.label}
                  </a>
                )}
              </React.Fragment>
            ))}

          </div>
        </nav>
      )}
    </header>
  );
}

Header.displayName = 'Header';
