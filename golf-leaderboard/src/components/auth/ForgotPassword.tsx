'use client'

import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate email
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message || 'Failed to send reset email');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <button 
        onClick={onBackToLogin}
        className="flex items-center text-green-600 hover:text-green-700 mb-4"
        disabled={isLoading}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Login
      </button>
      
      <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
        Reset Your Password
      </h2>
      
      {success ? (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
          <div className="text-center mb-4">
            <Mail className="mx-auto text-green-600 mb-2" size={48} />
          </div>
          <p className="font-medium">Reset Link Sent!</p>
          <p className="mt-1">Check your email for instructions to reset your password.</p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition duration-200 mt-4"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="reset-email">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}