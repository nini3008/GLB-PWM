import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext, AuthContextType } from '@/context/AuthContext'

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock profile for testing
export const mockProfile = {
  id: 'test-user-id',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  handicap: 10.5,
  bio: 'Test bio',
  profile_image_url: 'https://example.com/avatar.jpg',
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock admin profile
export const mockAdminProfile = {
  ...mockProfile,
  is_admin: true,
}

// Default mock auth context
const defaultAuthContext: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  resetPassword: jest.fn(),
}

interface AllTheProvidersProps {
  children: React.ReactNode
  authContext?: Partial<AuthContextType>
}

const AllTheProviders = ({ children, authContext }: AllTheProvidersProps) => {
  const mockAuthContext = {
    ...defaultAuthContext,
    ...authContext,
  }

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: Partial<AuthContextType>
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { authContext, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders authContext={authContext}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }
