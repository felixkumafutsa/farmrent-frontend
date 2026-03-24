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
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      bookingReminders: true,
      marketingEmails: false,
    },
    privacy: {
      showProfile: true,
      showContactInfo: false,
      allowReviews: true,
    },
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const currentUser = JSON.parse(userData);
      setUser(currentUser);
      setFormData({
        email: currentUser.email,
        phone: currentUser.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          bookingReminders: true,
          marketingEmails: false,
        },
        privacy: {
          showProfile: true,
          showContactInfo: false,
          allowReviews: true,
        },
      });
    }
    setLoading(false);
  }, []);

  const handleSaveSettings = async (section: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      let endpoint = '';
      let data = {};
      
      switch (section) {
        case 'general':
          endpoint = '${API_URL}/users/settings/general';
          data = {
            email: formData.email,
            phone: formData.phone,
          };
          break;
        case 'password':
          if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            Swal.fire({
              icon: 'warning',
              title: 'Validation Error',
              text: 'Please fill in all password fields',
              confirmButtonColor: '#ef4444'
            });
            return;
          }
          if (formData.newPassword !== formData.confirmPassword) {
            Swal.fire({
              icon: 'warning',
              title: 'Password Mismatch',
              text: 'New passwords do not match',
              confirmButtonColor: '#ef4444'
            });
            return;
          }
          endpoint = '${API_URL}/users/settings/password';
          data = {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          };
          break;
        case 'notifications':
          endpoint = '${API_URL}/users/settings/notifications';
          data = formData.notifications;
          break;
        case 'privacy':
          endpoint = '${API_URL}/users/settings/privacy';
          data = formData.privacy;
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        if (section === 'general') {
          const updatedUser = await response.json();
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        Swal.fire({
          icon: 'success',
          title: 'Settings Saved!',
          text: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`,
          confirmButtonColor: '#10b981'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: 'Failed to save settings',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Error',
        text: 'Failed to save settings',
        confirmButtonColor: '#ef4444'
      });
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {[
                  { id: 'general', name: 'General', icon: '⚙️' },
                  { id: 'password', name: 'Password', icon: '🔒' },
                  { id: 'notifications', name: 'Notifications', icon: '🔔' },
                  { id: 'privacy', name: 'Privacy', icon: '🔐' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
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
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveSettings('general')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Settings */}
              {activeTab === 'password' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Change Password</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveSettings('password')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notifications.emailNotifications}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              emailNotifications: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notifications.smsNotifications}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              smsNotifications: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notifications.bookingReminders}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              bookingReminders: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Booking reminders</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notifications.marketingEmails}
                          onChange={(e) => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              marketingEmails: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Marketing emails</span>
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveSettings('notifications')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Privacy Settings</h2>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.showProfile}
                          onChange={(e) => setFormData({
                            ...formData,
                            privacy: {
                              ...formData.privacy,
                              showProfile: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Make profile visible to other users</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.showContactInfo}
                          onChange={(e) => setFormData({
                            ...formData,
                            privacy: {
                              ...formData.privacy,
                              showContactInfo: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show contact information</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.privacy.allowReviews}
                          onChange={(e) => setFormData({
                            ...formData,
                            privacy: {
                              ...formData.privacy,
                              allowReviews: e.target.checked,
                            },
                          })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow users to leave reviews</span>
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveSettings('privacy')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save Privacy Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
