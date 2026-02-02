import '@testing-library/jest-dom'

// Suppress console errors for act warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('was not wrapped in act') ||
       args[0].includes('An update to'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock hasPointerCapture and setPointerCapture for Radix UI components
Element.prototype.hasPointerCapture = jest.fn()
Element.prototype.setPointerCapture = jest.fn()
Element.prototype.releasePointerCapture = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock the custom useNavigation hook
jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: jest.fn(() => ({
    goToDashboard: jest.fn(),
    goToLeaderboard: jest.fn(),
    goToEnterScore: jest.fn(),
    goToViewScores: jest.fn(),
    goToJoinSeason: jest.fn(),
    goToProfile: jest.fn(),
    goToLogin: jest.fn(),
    goToRegister: jest.fn(),
    goToForgotPassword: jest.fn(),
    goToResetPassword: jest.fn(),
    goToCreateSeason: jest.fn(),
    goToManageSeasons: jest.fn(),
    goToCreateGame: jest.fn(),
    goToManageScores: jest.fn(),
    goToManageCourses: jest.fn(),
    goToManageGames: jest.fn(),
    goToBonusRecalculate: jest.fn(),
    goToRecalculateHandicaps: jest.fn(),
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    },
  })),
}))
