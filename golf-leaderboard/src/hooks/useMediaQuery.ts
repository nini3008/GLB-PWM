/**
 * Custom hook for responsive media queries
 * Replaces duplicate mobile detection logic across components
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect media query matches
 * @param query - CSS media query string (default: mobile breakpoint)
 * @returns boolean indicating if media query matches
 */
export function useMediaQuery(query: string = '(max-width: 768px)'): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    const listener = () => setMatches(media.matches)
    listener()

    // Listen for changes
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * Convenience hook for mobile detection
 * @returns boolean indicating if screen is mobile size (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}