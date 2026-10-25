import { useEffect, useRef, useState } from 'react'

interface NavLink {
  name: string
  href: string
}

interface NavbarProps {
  brandName?: string
  navLinks?: NavLink[]
  signupLabel?: string
  signupHref?: string
  showSignup?: boolean
}

const defaultNavLinks: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function Navbar({
  brandName = 'MyBrand',
  navLinks = defaultNavLinks,
  signupLabel = 'Get Started',
  signupHref = '/signup',
  showSignup = true,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navbarRef = useRef<HTMLElement>(null)

  // Close the mobile menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isOpen) return

    function handleOutsideClick(event: PointerEvent) {
      if (
        navbarRef.current &&
        event.target instanceof Node &&
        !navbarRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <header
      ref={navbarRef}
      className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white font-['Roboto',sans-serif]"
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"
      >
        {/* Main Navbar */}
        <div className="flex h-[72px] items-center justify-between">
          {/* Brand */}
          <a
            href="/"
            aria-label={`${brandName} home`}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] text-lg font-bold text-white">
              {brandName.charAt(0).toUpperCase()}
            </div>

            <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
              {brandName}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={`${link.name}-${link.href}`}
                href={link.href}
                className="text-sm font-medium text-[#525252] transition-colors duration-200 hover:text-[#0A0A0A]"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Signup */}
          {showSignup && (
            <a
              href={signupHref}
              className="hidden rounded-lg bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#404040] md:inline-flex"
            >
              {signupLabel}
            </a>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E5E5] text-[#171717] transition-colors hover:bg-[#F5F5F5] md:hidden"
          >
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-navigation"
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out md:hidden ${
            isOpen
              ? 'max-h-[500px] border-t border-[#E5E5E5] opacity-100'
              : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <div className="py-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-[#737373]">
              Navigation
            </p>

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              {navLinks.map((link, index) => (
                <a
                  key={`${link.name}-${link.href}`}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-[#F5F5F5]"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-xs text-[#A3A3A3]">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="text-sm font-medium text-[#404040] transition-colors group-hover:text-[#0A0A0A]">
                      {link.name}
                    </span>
                  </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4 text-[#A3A3A3] transition-transform group-hover:translate-x-1 group-hover:text-[#171717]"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14m-7-7 7 7-7 7"
                    />
                  </svg>
                </a>
              ))}
            </div>

            {/* Mobile Signup */}
            {showSignup && (
              <div className="mt-4 border-t border-[#E5E5E5] pt-4">
                <a
                  href={signupHref}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#404040]"
                >
                  {signupLabel}
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
