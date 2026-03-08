'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface Equipment {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  location: string;
  status: string;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
  };
  vendor: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    businessName: string;
    businessAddress: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  equipment: {
    id: string;
    name: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: number[];
}

export default function EquipmentDetailsPage() {
  const params = useParams();
  const equipmentId = params.id as string;
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEquipmentDetails();
    fetchReviews();
  }, [equipmentId]);

  const fetchEquipmentDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:3001/equipment/${equipmentId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        console.error('Failed to fetch equipment details');
      }
    } catch (error) {
      console.error('Error fetching equipment details:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:3001/reviews/equipment/${equipmentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }

      // Fetch review stats
      const statsResponse = await fetch(`http://localhost:3001/reviews/equipment/${equipmentId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setReviewStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in to submit a review',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      // Find a completed booking for this equipment
      const bookingsResponse = await fetch('http://localhost:3001/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        const completedBooking = bookings.find((booking: any) => 
          booking.equipmentId === equipmentId && 
          booking.status === 'COMPLETED' &&
          booking.farmerId === user.id
        );

        if (!completedBooking) {
          Swal.fire({
            icon: 'warning',
            title: 'Booking Required',
            text: 'You can only review equipment after completing a booking',
            confirmButtonColor: '#10b981'
          });
          return;
        }

        const response = await fetch('http://localhost:3001/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId: completedBooking.id,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
          }),
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Review Submitted!',
            text: 'Your review has been submitted successfully.',
            confirmButtonColor: '#10b981'
          });
          setShowReviewForm(false);
          setReviewForm({ rating: 5, comment: '' });
          fetchReviews();
        } else {
          const errorData = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: errorData.message || 'Failed to submit review',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Error',
        text: 'Failed to submit review',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!equipment) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Equipment not found</h1>
          <p className="text-gray-600">The equipment you're looking for doesn't exist.</p>
          <Link href="/dashboard/equipment" className="mt-4 inline-block text-green-600 hover:text-green-700">
            ← Back to Equipment
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <Link href="/dashboard/equipment" className="text-green-600 hover:text-green-700">
            ← Back to Equipment
          </Link>
        </div>

        {/* Equipment Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3">
              {equipment.imageUrl ? (
                <img
                  src={equipment.imageUrl}
                  alt={equipment.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-4xl font-bold">
                    {equipment.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="md:w-2/3 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
                  <p className="text-gray-600 mt-1">{equipment.category.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">${equipment.pricePerDay}</p>
                  <p className="text-gray-600">per day</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{equipment.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="text-gray-900">{equipment.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    equipment.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {equipment.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {equipment.vendor.user.firstName.charAt(0)}{equipment.vendor.user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {equipment.vendor.user.firstName} {equipment.vendor.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{equipment.vendor.businessName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(reviewStats.averageRating)}
                    <p className="text-sm text-gray-500">{reviewStats.totalReviews} reviews</p>
                  </div>
                </div>
              </div>

              {equipment.status === 'AVAILABLE' && user?.role === 'FARMER' && (
                <div className="mt-6">
                  <Link
                    href={`/equipment/${equipment.id}/book`}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 text-center block"
                  >
                    Book This Equipment
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Customer Reviews</h2>
              {user && user.role === 'FARMER' && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Write a Review
                </button>
              )}
            </div>
          </div>

          {/* Review Stats */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-gray-900 mr-4">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div>
                  {renderStars(Math.round(reviewStats.averageRating))}
                  <p className="text-sm text-gray-500">{reviewStats.totalReviews} reviews</p>
                </div>
              </div>
              <div className="flex-1 ml-8">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center mb-1">
                    <div className="w-12 text-sm font-medium text-gray-900">{rating} stars</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${reviewStats.totalReviews > 0 ? (reviewStats.ratingDistribution[rating - 1] / reviewStats.totalReviews) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 text-right">
                      {reviewStats.ratingDistribution[rating - 1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview}>
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
                    placeholder="Share your experience with this equipment..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Submit Review
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
            </div>
          )}

          {/* Reviews List */}
          <div className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No reviews yet. Be the first to review this equipment!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {review.user.firstName} {review.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="ml-4">
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-gray-900">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
