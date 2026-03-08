'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchEquipment();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, selectedCategory, selectedCondition, priceRange]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { id: '1', name: 'Tractors' },
        { id: '2', name: 'Plows' },
        { id: '3', name: 'Harvesters' },
        { id: '4', name: 'Irrigation' },
        { id: '5', name: 'Planters' },
      ]);
    }
  };

  const filterEquipment = () => {
    let filtered = [...equipment];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }

    // Condition filter
    if (selectedCondition) {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(item => item.pricePerDay >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(item => item.pricePerDay <= parseFloat(priceRange.max));
    }

    setFilteredEquipment(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCondition('');
    setPriceRange({ min: '', max: '' });
  };

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      console.log('Token exists:', !!token);
      console.log('Current user:', currentUser);
      
      if (!token) {
        console.error('No authentication token found');
        setEquipment([]);
        setLoading(false);
        return;
      }
      
      let apiUrl = 'http://localhost:3001/equipment';
      
      // Context-aware fetching based on user role
      if (currentUser?.role === 'VENDOR') {
        // Vendors should only see their own equipment
        apiUrl = 'http://localhost:3001/equipment/my-equipment';
      } else if (currentUser?.role === 'FARMER') {
        // Farmers should see available equipment for rent
        apiUrl = 'http://localhost:3001/equipment?status=AVAILABLE';
      }
      // ADMIN sees all equipment (default)

      console.log('Fetching from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Equipment data received:', data);
        
        // Fetch vendor ratings for each equipment
        const equipmentWithRatings = await Promise.all(
          data.map(async (item: any) => {
            try {
              const ratingResponse = await fetch(`http://localhost:3001/reviews/vendor/${item.vendorId}/stats`);
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return {
                  ...item,
                  vendorRating: ratingData.averageRating.toFixed(1),
                  vendorReviews: ratingData.totalReviews,
                };
              }
            } catch (error) {
              console.error('Error fetching vendor rating:', error);
            }
            return {
              ...item,
              vendorRating: 'N/A',
              vendorReviews: 0,
            };
          })
        );
        
        setEquipment(equipmentWithRatings);
      } else {
        console.error('Failed to fetch equipment:', response.status, response.statusText);
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
          // Clear invalid token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        setEquipment([]); // Set empty array on error, not mock data
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]); // Set empty array on error, not mock data
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/equipment/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from both equipment and filteredEquipment arrays
        setEquipment(prev => prev.filter(item => item.id !== id));
        setFilteredEquipment(prev => prev.filter(item => item.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Equipment Deleted!',
          text: 'Equipment deleted successfully',
          confirmButtonColor: '#10b981'
        });
      } else {
        const errorData = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: errorData.message || 'Failed to delete equipment',
            confirmButtonColor: '#ef4444'
          });
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Error',
        text: 'Failed to delete equipment',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleRentNow = (equipmentId: string) => {
    window.location.href = `/equipment/${equipmentId}/book`;
  };

  const canAddEquipment = user?.role === 'VENDOR' || user?.role === 'ADMIN';
  const canEditDeleteEquipment = user?.role === 'VENDOR' || user?.role === 'ADMIN';

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'FARMER' ? 'Available Equipment' : 
               user?.role === 'VENDOR' ? 'My Equipment' : 
               'Equipment Management'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'FARMER' ? 'Browse available equipment for rent' :
               user?.role === 'VENDOR' ? 'Manage your equipment listings' :
               'Manage all equipment on the platform'}
            </p>
          </div>
          {canAddEquipment && (
            <Link
              href="/equipment/create"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Equipment
            </Link>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search equipment name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (Day)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredEquipment.length} of {equipment.length} items
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {equipment.length === 0 ? 'No equipment found' : 'No equipment matches your filters'}
            </h3>
            <p className="text-gray-500 mb-4">
              {equipment.length === 0 
                ? (user?.role === 'VENDOR' ? 'Start by adding your first equipment' : 'No equipment available at the moment')
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {equipment.length === 0 && canAddEquipment && (
              <Link
                href="/equipment/create"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Add Your First Equipment
              </Link>
            )}
            {equipment.length > 0 && (
              <button
                onClick={clearFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEquipment.map((item) => (
              <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Equipment Image */}
                <div className="h-48 bg-gray-200 relative">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.isAvailable || item.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isAvailable ? 'Available' : item.status || 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm">
                      <span className="font-semibold text-green-600">${item.pricePerDay || item.price}</span>
                      <span className="text-gray-500">/day</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        item.condition === 'EXCELLENT' ? 'bg-blue-100 text-blue-800' :
                        item.condition === 'GOOD' ? 'bg-green-100 text-green-800' :
                        item.condition === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.condition}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {item.location}
                  </div>

                  {/* Vendor Info */}
                  {item.vendor && (
                    <div className="border-t pt-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-xs font-medium">
                              {item.vendor.user?.firstName?.charAt(0)}{item.vendor.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-2">
                            <p className="text-xs font-medium text-gray-900">
                              {item.vendor.user?.firstName} {item.vendor.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{item.vendor.businessName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-xs">
                            <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.118-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-gray-600">{item.vendorRating || 'N/A'}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.vendorReviews || 0} reviews</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {user?.role === 'FARMER' ? (
                      <button 
                        onClick={() => handleRentNow(item.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                      >
                        Rent Now
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/equipment/${item.id}/edit`}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
