'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';


export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">FarmRent</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Rent Farm Equipment
            <span className="block text-green-600">Easy & Affordable</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Connect with local equipment vendors and rent the tools you need for your farm. 
            From tractors to irrigation systems, find everything in one place.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/dashboard/equipment"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Browse Equipment
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-500">
              Simple steps to get the equipment you need
            </p>
          </div>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                        <span className="text-white font-bold">1</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Sign Up</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Create your account and tell us about your farming needs
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                        <span className="text-white font-bold">2</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Browse Equipment</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Search through our inventory of available farm equipment
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                        <span className="text-white font-bold">3</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Rent & Use</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Book the equipment you need and pick it up from the vendor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-500">
              © 2024 FarmRent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
