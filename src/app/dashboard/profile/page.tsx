'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

interface VendorProfile {
  id: string;
  businessName: string;
  businessAddress: string;
  kycDocumentUrl?: string;
  kycStatus: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!token || !currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setFormData({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone || '',
      });

      // Fetch vendor profile if user is a vendor
      if (currentUser.role === 'VENDOR') {
        const response = await fetch('http://localhost:3001/users/profile/vendor', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const vendorData = await response.json();
          setVendorProfile(vendorData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:3001/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setEditing(false);
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Profile updated successfully!',
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update profile',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Error',
        text: 'Failed to update profile',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">Please log in again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phone: user.phone || '',
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                        <p className="text-lg text-gray-900">{user.firstName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                        <p className="text-lg text-gray-900">{user.lastName}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="text-lg text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                      <p className="text-lg text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Role</h3>
                      <p className="text-lg text-gray-900 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                      <p className="text-lg text-gray-900">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Business Information */}
            {user.role === 'VENDOR' && vendorProfile && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Business Information</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
                    <p className="text-lg text-gray-900">{vendorProfile.businessName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Address</h3>
                    <p className="text-lg text-gray-900">{vendorProfile.businessAddress}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">KYC Status</h3>
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white text-2xl font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                {user.role === 'FARMER' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Rentals</span>
                      <span className="text-lg font-medium text-gray-900">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Rentals</span>
                      <span className="text-lg font-medium text-blue-600">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="text-lg font-medium text-gray-900">$1,250</span>
                    </div>
                  </>
                )}
                {user.role === 'VENDOR' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Equipment Listed</span>
                      <span className="text-lg font-medium text-gray-900">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="text-lg font-medium text-gray-900">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="text-lg font-medium text-green-600">$12,450</span>
                    </div>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="text-lg font-medium text-gray-900">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Equipment</span>
                      <span className="text-lg font-medium text-gray-900">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="text-lg font-medium text-gray-900">342</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                {user.role === 'FARMER' && (
                  <>
                    <a
                      href="/dashboard/bookings"
                      className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      View My Bookings
                    </a>
                    <a
                      href="/dashboard/equipment"
                      className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Browse Equipment
                    </a>
                  </>
                )}
                {user.role === 'VENDOR' && (
                  <>
                    <a
                      href="/dashboard/equipment"
                      className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Manage Equipment
                    </a>
                    <a
                      href="/dashboard/earnings"
                      className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      View Earnings
                    </a>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <a
                      href="/dashboard/analytics"
                      className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      View Analytics
                    </a>
                    <a
                      href="/dashboard/users"
                      className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Manage Users
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
