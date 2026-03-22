"use client";

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <div className="min-h-screen flex">
    <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-400 to-green-600 items-center justify-center">
      <span className="text-white text-3xl font-bold">Bem-vindo!</span>
    </div>
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 rounded shadow bg-white">
        {children}
      </div>
    </div>
  </div>
); 