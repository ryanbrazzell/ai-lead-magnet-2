"use client";

import * as React from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  logo?: React.ReactNode | string;
  href?: string;
  showNav?: boolean;
  className?: string;
  activePath?: string;
}

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

const navLinks: NavLink[] = [
  { label: "Home", href: "https://www.assistantlaunch.com/" },
  {
    label: "About",
    href: "#",
    children: [
      { label: "What We Do", href: "https://www.assistantlaunch.com/what-we-do" },
      { label: "FAQs", href: "https://www.assistantlaunch.com/faq" },
    ],
  },
  { label: "Services", href: "https://www.assistantlaunch.com/services" },
  { label: "Success Stories", href: "https://www.assistantlaunch.com/success-stories" },
];

function LogoContent({ logo }: { logo?: React.ReactNode | string }) {
  if (!logo) {
    return (
      <span className="font-serif text-xl font-semibold tracking-[-0.02em] text-primary">
        Assistant Launch
      </span>
    );
  }

  if (typeof logo === "string") {
    return (
      <img
        src={logo}
        alt="Assistant Launch"
        className="h-8 w-auto object-contain md:h-10"
      />
    );
  }

  return <>{logo}</>;
}

function DropdownMenu({
  items,
  isOpen,
  onClose,
}: {
  items: NavLink[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 top-full z-50 mt-2 min-w-[180px] rounded-[var(--radius-md)] border border-border bg-white p-2 shadow-[0_18px_32px_rgba(26,24,22,0.12)]"
      onMouseLeave={onClose}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="block rounded-[8px] px-3 py-2 text-sm text-primary transition-colors hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-hover)]"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function Header({
  logo,
  href,
  showNav = true,
  className,
  activePath,
}: HeaderProps) {
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
        "sticky top-0 z-50 w-full border-b border-border/80 bg-[rgba(250,250,247,0.94)] px-4 py-3 backdrop-blur-xl md:px-6",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 rounded-[var(--radius-lg)] border border-border/80 bg-white/70 px-4 py-3 shadow-[0_6px_20px_rgba(26,24,22,0.05)]">
        <a
          href={href || "https://www.assistantlaunch.com/"}
          className="rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Go to homepage"
        >
          {logoContent}
        </a>

        {showNav && (
          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.children ? (
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-[15px] font-medium transition-colors",
                      isActive(link.href)
                        ? "text-[var(--color-accent)]"
                        : "text-[color:var(--color-secondary)] hover:text-primary"
                    )}
                    aria-expanded={openDropdown === link.label}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openDropdown === link.label && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  <a
                    href={link.href}
                    className={cn(
                      "block px-3 py-2 text-[15px] font-medium transition-colors",
                      isActive(link.href)
                        ? "text-[var(--color-accent)]"
                        : "text-[color:var(--color-secondary)] hover:text-primary"
                    )}
                  >
                    {link.label}
                  </a>
                )}

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

        {showNav && (
          <button
            className="p-2 text-primary md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
      </div>

      {showNav && mobileMenuOpen && (
        <nav className="mx-2 mt-4 rounded-[var(--radius-lg)] border border-border bg-white px-4 pb-4 pt-4 shadow-[0_12px_24px_rgba(26,24,22,0.08)] md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <React.Fragment key={link.label}>
                {link.children ? (
                  <div className="py-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      {link.label}
                    </span>
                    <div className="mt-2 ml-4 flex flex-col gap-2">
                      {link.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="text-[15px] text-[color:var(--color-secondary)] transition-colors hover:text-primary"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.href}
                    className={cn(
                      "py-2 text-[15px] font-medium transition-colors",
                      isActive(link.href)
                        ? "text-[var(--color-accent)]"
                        : "text-[color:var(--color-secondary)] hover:text-primary"
                    )}
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

Header.displayName = "Header";
