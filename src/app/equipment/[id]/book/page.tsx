'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { API_URL } from '@/lib/api';


export default function BookEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;
  
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'FARMER') {
        Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Only farmers can book equipment',
          confirmButtonColor: '#ef4444'
        });
        router.push('/dashboard/equipment');
        return;
      }
    }
    
    fetchEquipment();
  }, [equipmentId, router]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/equipment/${equipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Equipment Not Found',
          text: 'The equipment you are looking for does not exist.',
          confirmButtonColor: '#ef4444'
        });
        router.push('/dashboard/equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to load equipment details',
        confirmButtonColor: '#ef4444'
      });
      router.push('/dashboard/equipment');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Calculate days
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 30) {
        newErrors.endDate = 'Maximum rental period is 30 days';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const bookingData = {
        equipmentId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      
      console.log('Sending booking data:', bookingData);
      console.log('Authorization token exists:', !!token);
      
      const response = await fetch('${API_URL}/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          icon: 'success',
          title: 'Booking Submitted!',
          text: 'Booking request submitted successfully!',
          confirmButtonColor: '#10b981'
        });
        router.push('/dashboard/bookings');
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Booking Failed',
          text: errorData.message || 'Failed to create booking',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Swal.fire({
        icon: 'error',
        title: 'Booking Error',
        text: 'Failed to create booking',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!formData.startDate || !formData.endDate || !equipment) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return days * equipment.pricePerDay;
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment Not Found</h2>
          <Link href="/dashboard/equipment" className="text-green-600 hover:text-green-700">
            Back to Equipment
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <Link href="/dashboard/equipment" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Back to Equipment
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Book Equipment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="h-48 bg-gray-200">
                {equipment.images && equipment.images.length > 0 ? (
                  <img
                    src={equipment.images[0]}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{equipment.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{equipment.category?.name}</p>
                <p className="text-xs text-gray-600 mb-3">{equipment.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Price per day:</span>
                    <span className="font-semibold text-green-600">${equipment.pricePerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Deposit:</span>
                    <span className="font-semibold">${equipment.deposit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Condition:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      equipment.condition === 'EXCELLENT' ? 'bg-blue-100 text-blue-800' :
                      equipment.condition === 'GOOD' ? 'bg-green-100 text-green-800' :
                      equipment.condition === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {equipment.condition}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Location:</span>
                    <span className="text-xs">{equipment.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                    />
                    {errors.endDate && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                {formData.startDate && formData.endDate && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Price Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Rate:</span>
                        <span>${equipment.pricePerDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rental Days:</span>
                        <span>{calculateDays()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${calculateTotalPrice()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit:</span>
                        <span>${equipment.deposit}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total Amount:</span>
                          <span className="text-green-600">${calculateTotalPrice() + equipment.deposit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Booking'}
                  </button>
                  <Link
                    href="/dashboard/equipment"
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
