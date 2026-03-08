'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      console.log('Bookings - Token exists:', !!token);
      console.log('Bookings - Current user:', currentUser);
      
      if (!token) {
        console.error('No authentication token found for bookings');
        setBookings([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:3001/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Failed to fetch bookings:', response.status);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.farmer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.farmer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= startDate
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchBookings();
        Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: 'Booking confirmed successfully!',
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Confirmation Failed',
          text: 'Failed to confirm booking',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      Swal.fire({
        icon: 'error',
        title: 'Confirmation Error',
        text: 'Failed to confirm booking',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchBookings();
        Swal.fire({
          icon: 'success',
          title: 'Booking Rejected!',
          text: 'Booking rejected successfully!',
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Rejection Failed',
          text: 'Failed to reject booking',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Swal.fire({
        icon: 'error',
        title: 'Rejection Failed',
        text: 'Failed to reject booking',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchBookings();
        Swal.fire({
          icon: 'success',
          title: 'Booking Cancelled!',
          text: 'Booking cancelled successfully!',
          confirmButtonColor: '#10b981'
        });
      } else {
        setBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'CANCELLED' }
              : booking
          )
        );
        Swal.fire({
          icon: 'success',
          title: 'Booking Cancelled!',
          text: 'Booking cancelled successfully!',
          confirmButtonColor: '#10b981'
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Swal.fire({
        icon: 'error',
        title: 'Cancellation Error',
        text: 'Failed to cancel booking',
        confirmButtonColor: '#ef4444'
      });
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

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'FARMER' ? 'My Bookings' : 
             user?.role === 'VENDOR' ? 'Booking Requests' : 
             'All Bookings'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'FARMER' ? 'View and manage your equipment rental bookings' :
             user?.role === 'VENDOR' ? 'Manage booking requests for your equipment' :
             'Manage all bookings on the platform'}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-4">
              {user?.role === 'FARMER' ? 'You haven\'t made any bookings yet' :
               user?.role === 'VENDOR' ? 'No booking requests for your equipment yet' :
               'No bookings in the system'}
            </p>
            {user?.role === 'FARMER' && (
              <Link
                href="/dashboard/equipment"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Browse Equipment
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {user?.role === 'FARMER' ? 'Rental Period' : 'Farmer'}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.equipment.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.equipment.category?.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user?.role === 'FARMER' ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.farmer.firstName} {booking.farmer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.farmer.email}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${booking.totalPrice}</div>
                          <div className="text-sm text-gray-500">+${booking.depositAmount} deposit</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2">
                            {user?.role === 'VENDOR' && booking.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleConfirm(booking.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleReject(booking.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(user?.role === 'FARMER' || user?.role === 'VENDOR') && 
                             (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                            <Link
                              href={`/bookings/${booking.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
