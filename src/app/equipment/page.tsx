'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { mockEquipment } from '@/lib/mockData';

interface Equipment {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  pricePerWeek?: number;
  deposit: number;
  location: string;
  images: string[];
  isAvailable: boolean;
  condition: string;
  category: {
    name: string;
  };
  vendor: {
    businessName: string;
    rating?: number;
  };
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`${API_URL}/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        // Use mock data if backend is not available
        setEquipment(mockEquipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      // Use mock data as fallback
      setEquipment(mockEquipment);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipment.map(item => item.category.name))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-green-700">
                🚜 FarmRent
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/equipment" className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                  Equipment
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading equipment...</p>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No equipment found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEquipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Equipment Image */}
                <div className="relative h-48 bg-gray-100">
                  {item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-4xl text-gray-400">🚜</span>
                    </div>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                      Rented
                    </div>
                  )}
                </div>

                {/* Equipment Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.category.name}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">${item.pricePerDay}/day</p>
                      {item.pricePerWeek && (
                        <p className="text-sm text-gray-500">${item.pricePerWeek}/week</p>
                      )}
                      <p className="text-sm text-gray-500">Deposit: ${item.deposit}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Condition: {item.condition}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        Vendor: {item.vendor.businessName}
                      </span>
                    </div>
                    <Link
                      href={`/equipment/${item.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
