'use client'

import ResetPasswordPage from '@/components/auth/ResetPasswordPage';

export default function ResetPassword() {
  return <ResetPasswordPage onComplete={function (): void {
      throw new Error('Function not implemented.');
  } } />;
}