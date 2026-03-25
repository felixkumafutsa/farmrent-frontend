'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { API_URL } from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  booking: {
    equipment: {
      id: string;
      name: string;
    };
    farmer: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!token || !currentUser) {
        setLoading(false);
        return;
      }
      
      // Fetch vendor reviews
      const reviewsResponse = await fetch(`${API_URL}/reviews/vendor/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch vendor stats
      const statsResponse = await fetch(`${API_URL}/reviews/vendor/${currentUser.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData || []);
      } else {
        console.error('Failed to fetch reviews:', reviewsResponse.status);
        setReviews([]);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      } else {
        console.error('Failed to fetch stats:', statsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
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

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === 'all') return true;
    return review.rating === parseInt(selectedFilter);
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'VENDOR') {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only vendors can access reviews data.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="mt-2 text-gray-600">Manage customer feedback and ratings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
                  <div className="ml-2">{renderStars(Math.round(stats.averageRating))}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Response Rate</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">85%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Rating Distribution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <div className="w-12 text-sm font-medium text-gray-900">{rating} stars</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating - 1] / stats.totalReviews) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 text-right">
                    {stats.ratingDistribution[rating - 1]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by rating:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Reviews</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <span className="text-sm text-gray-500">
              {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customer Reviews</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredReviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No reviews found</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {review.booking.farmer.firstName.charAt(0)}{review.booking.farmer.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {review.booking.farmer.firstName} {review.booking.farmer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-900">{review.comment}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Review for: {review.booking.equipment.name}
                    </div>
                    <div className="mt-4 flex items-center space-x-4">
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Reply
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                        Report
                      </button>
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
