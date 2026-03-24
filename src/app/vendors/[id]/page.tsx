'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { API_URL } from '@/lib/api';


interface VendorProfile {
  id: string;
  businessName: string;
  businessAddress: string;
  kycStatus: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id as string;
  
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVendorProfile();
    fetchVendorReviews();
  }, [vendorId]);

  const fetchVendorProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/vendors/${vendorId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setVendorProfile(data);
      } else {
        console.error('Failed to fetch vendor profile');
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    }
  };

  const fetchVendorReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/vendor/${vendorId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }

      // Fetch review stats
      const statsResponse = await fetch(`${API_URL}/reviews/vendor/${vendorId}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setReviewStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vendorProfile) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor not found</h1>
          <p className="text-gray-600">The vendor profile you're looking for doesn't exist.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        {/* Vendor Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-2xl font-bold">
                    {vendorProfile.user.firstName.charAt(0)}{vendorProfile.user.lastName.charAt(0)}
                  </span>
                </div>
                <div className="ml-6">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vendorProfile.user.firstName} {vendorProfile.user.lastName}
                  </h1>
                  <p className="text-lg text-gray-600">{vendorProfile.businessName}</p>
                  <p className="text-sm text-gray-500">{vendorProfile.user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center mb-2">
                  {renderStars(Math.round(reviewStats.averageRating))}
                </div>
                <p className="text-sm text-gray-500">{reviewStats.totalReviews} reviews</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  vendorProfile.kycStatus === 'VERIFIED' 
                    ? 'bg-green-100 text-green-800' 
                    : vendorProfile.kycStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vendorProfile.kycStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Business Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Business Name</h4>
                    <p className="text-gray-900">{vendorProfile.businessName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Business Address</h4>
                    <p className="text-gray-900">{vendorProfile.businessAddress}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">KYC Status</h4>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendorProfile.kycStatus === 'VERIFIED' 
                        ? 'bg-green-100 text-green-800' 
                        : vendorProfile.kycStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vendorProfile.kycStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rating Overview</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
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
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Customer Reviews</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No reviews yet for this vendor.</p>
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
                      <div className="mt-2 text-sm text-gray-500">
                        Reviewed: {review.equipment.name}
                      </div>
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
