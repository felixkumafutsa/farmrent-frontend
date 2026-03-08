'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositAmount: number;
  status: string;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    imageUrl?: string;
    category: {
      name: string;
    };
    vendor: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
      businessName: string;
    };
  };
  farmer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Review {
  rating: number;
  comment: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<Review>({
    rating: 5,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        console.error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in to submit a review');
        return;
      }

      const response = await fetch('http://localhost:3001/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: bookingId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.118-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}.0)</span>
      </div>
    );
  };

  const renderStarInput = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
            className="focus:outline-none"
          >
            <svg
              className={`w-6 h-6 ${
                star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.118-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h1>
          <p className="text-gray-600">The booking you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600">View and manage your booking information</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Booking Status */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Booking #{booking.id.slice(0, 8)}</h2>
                <p className="text-gray-600">Created on {formatDate(booking.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            {/* Equipment Details */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Information</h3>
              <div className="flex items-center">
                {booking.equipment.imageUrl ? (
                  <img
                    src={booking.equipment.imageUrl}
                    alt={booking.equipment.name}
                    className="w-20 h-20 rounded object-cover mr-4"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center mr-4">
                    <span className="text-gray-600 text-2xl font-bold">
                      {booking.equipment.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{booking.equipment.name}</h4>
                  <p className="text-gray-600">{booking.equipment.category.name}</p>
                  <p className="text-sm text-gray-500">
                    Owner: {booking.equipment.vendor.user.firstName} {booking.equipment.vendor.user.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Period */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rental Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Rental Price</p>
                  <p className="font-medium text-gray-900">${booking.totalPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deposit Amount</p>
                  <p className="font-medium text-gray-900">${booking.depositAmount}</p>
                </div>
              </div>
            </div>

            {/* Review Section - Only show for completed bookings */}
            {booking.status === 'COMPLETED' && user?.role === 'FARMER' && (
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Rate Your Experience</h3>
                  {!showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      {renderStarInput()}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Share your experience with this equipment and the vendor..."
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
