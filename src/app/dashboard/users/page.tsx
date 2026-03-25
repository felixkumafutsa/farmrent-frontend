'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/api';


interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  createdAt?: string;
  stats?: {
    totalEquipment?: number;
    totalBookings?: number;
    totalRevenue?: number;
  };
}

interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'FARMER' | 'VENDOR' | 'ADMIN';
  phone?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'FARMER',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSearchUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // For vendors, fetch their analytics
        const usersWithStats = await Promise.all(
          data.map(async (user: User) => {
            if (user.role === 'VENDOR') {
              try {
                const analyticsResponse = await fetch(`${API_URL}/users/vendors/${user.id}/analytics`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                
                if (analyticsResponse.ok) {
                  const analytics = await analyticsResponse.json();
                  return { ...user, stats: analytics.stats };
                }
              } catch (error) {
                console.error('Error fetching vendor analytics:', error);
              }
            }
            return user;
          })
        );
        
        setUsers(usersWithStats);
      } else {
        // Mock data for now
        const mockUsers = [
          { id: '1', email: 'admin@farmrent.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN', status: 'ACTIVE', createdAt: '2024-01-15' },
          { id: '2', email: 'farmer@farmrent.com', firstName: 'John', lastName: 'Farmer', role: 'FARMER', status: 'ACTIVE', createdAt: '2024-01-20' },
          { id: '3', email: 'vendor@farmrent.com', firstName: 'Jane', lastName: 'Vendor', role: 'VENDOR', status: 'ACTIVE', createdAt: '2024-01-25', 
            stats: { totalEquipment: 5, totalBookings: 12, totalRevenue: 1500 } },
          { id: '4', email: 'farmer2@farmrent.com', firstName: 'Mike', lastName: 'Smith', role: 'FARMER', status: 'PENDING', createdAt: '2024-02-01' },
          { id: '5', email: 'vendor2@farmrent.com', firstName: 'Sarah', lastName: 'Jones', role: 'VENDOR', status: 'SUSPENDED', createdAt: '2024-02-05',
            stats: { totalEquipment: 3, totalBookings: 8, totalRevenue: 900 } },
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const mockUsers = [
        { id: '1', email: 'admin@farmrent.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN', status: 'ACTIVE', createdAt: '2024-01-15' },
        { id: '2', email: 'farmer@farmrent.com', firstName: 'John', lastName: 'Farmer', role: 'FARMER', status: 'ACTIVE', createdAt: '2024-01-20' },
        { id: '3', email: 'vendor@farmrent.com', firstName: 'Jane', lastName: 'Vendor', role: 'VENDOR', status: 'ACTIVE', createdAt: '2024-01-25' },
        { id: '4', email: 'farmer2@farmrent.com', firstName: 'Mike', lastName: 'Smith', role: 'FARMER', status: 'PENDING', createdAt: '2024-02-01' },
        { id: '5', email: 'vendor2@farmrent.com', firstName: 'Sarah', lastName: 'Jones', role: 'VENDOR', status: 'SUSPENDED', createdAt: '2024-02-05' },
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchUsers = () => {
    let filtered = users;

    // Search functionality
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/users/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, newUser]);
        setShowCreateForm(false);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'FARMER',
          phone: '',
        });
        
        Swal.fire({
          icon: 'success',
          title: 'User Created',
          text: `${newUser.firstName} ${newUser.lastName} has been created successfully!`,
        });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create user. Please try again.',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
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

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users and their roles</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="FARMER">Farmer</option>
              <option value="VENDOR">Vendor</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count and Add User Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="FARMER">Farmer</option>
                      <option value="VENDOR">Vendor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'FARMER' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'VENDOR' ? (
                            <div className="text-sm text-gray-900">
                              {user.stats?.totalEquipment || 0}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'VENDOR' ? (
                            <div className="text-sm text-gray-900">
                              {user.stats?.totalBookings || 0}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'VENDOR' ? (
                            <div className="text-sm font-medium text-gray-900">
                              ${user.stats?.totalRevenue?.toFixed(2) || '0.00'}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
