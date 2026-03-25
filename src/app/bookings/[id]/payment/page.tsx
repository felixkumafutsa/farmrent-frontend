'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { API_URL } from '@/lib/api';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositAmount: number;
  status: string;
  equipment: {
    id: string;
    name: string;
    images: string[];
    vendor: {
      user: {
        firstName: string;
        lastName: string;
      };
      businessName: string;
    };
  };
}

export default function PaymentPage() {
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('AIRTEL_MONEY');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        console.error('Failed to fetch booking:', response.status);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!phoneNumber || !booking) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Create escrow transaction
      const escrowResponse = await fetch(`${API_URL}/payments/escrow/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: booking.totalPrice,
          provider: paymentMethod,
        }),
      });

      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
        
        // Simulate mobile money payment
        alert(`Payment initiated!\n\nAmount: MWK ${booking.totalPrice}\nProvider: ${paymentMethod}\nPhone: ${phoneNumber}\n\nReference: ${escrowData.payment.transactionRef}\n\nThis is a mock payment. In production, this would integrate with actual mobile money APIs.`);
        
        // Redirect back to booking details
        window.location.href = `/bookings/${bookingId}`;
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600">The booking you're trying to pay for could not be found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600">Secure your equipment booking with escrow protection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="flex items-center mb-6">
                {booking.equipment.images?.[0] && (
                  <img
                    src={booking.equipment.images[0]}
                    alt={booking.equipment.name}
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{booking.equipment.name}</h3>
                  <p className="text-gray-600">
                    Vendor: {booking.equipment.vendor.user.firstName} {booking.equipment.vendor.user.lastName}
                    {booking.equipment.vendor.businessName && ` - ${booking.equipment.vendor.businessName}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Equipment Rental</span>
                  <span className="font-medium">MWK {booking.totalPrice - booking.depositAmount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">MWK {booking.depositAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span>MWK {booking.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Mobile Money Provider</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="TNM_MPAMBA">TNM Mpamba</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your mobile money number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !phoneNumber}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  `Pay MWK ${booking.totalPrice}`
                )}
              </button>
            </div>
          </div>

          {/* Escrow Information */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-semibold text-blue-900">Escrow Protection</h3>
              </div>
              <p className="text-blue-800 text-sm mb-4">
                Your payment is held securely in escrow until the equipment is delivered and confirmed.
              </p>
              <ul className="text-blue-800 text-sm space-y-2">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment held securely
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Vendor paid after confirmation
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Refund if issues arise
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notes</h3>
              <ul className="text-yellow-800 text-sm space-y-2">
                <li>• This is a demo payment system</li>
                <li>• No actual charges will be made</li>
                <li>• In production, real mobile money APIs would be used</li>
                <li>• Your payment is protected by our escrow system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
