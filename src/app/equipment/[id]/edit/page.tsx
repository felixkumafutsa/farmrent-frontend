'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/api';


export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [categories, setCategories] = useState([]);
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
    pricePerWeek: '',
    deposit: '',
    location: '',
    condition: 'EXCELLENT',
    categoryId: '',
    isAvailable: true,
  });

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/equipment/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
        setFormData({
          name: data.name,
          description: data.description,
          pricePerDay: data.pricePerDay.toString(),
          pricePerWeek: data.pricePerWeek.toString(),
          deposit: data.deposit.toString(),
          location: data.location,
          condition: data.condition,
          categoryId: data.category.id,
          isAvailable: data.isAvailable,
        });
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
      router.push('/dashboard/equipment');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('${API_URL}/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          pricePerDay: parseFloat(formData.pricePerDay),
          pricePerWeek: parseFloat(formData.pricePerWeek),
          deposit: parseFloat(formData.deposit),
        }),
      });

      if (response.ok) {
        router.push('/dashboard/equipment');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update equipment',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Error',
        text: 'Failed to update equipment',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!equipment) {
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Equipment</h1>
          <p className="text-gray-600">Update equipment information</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Equipment Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                >
                  <option value="">Select a category</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-base font-semibold text-gray-800 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Price per Day ($)</label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Price per Week ($)</label>
                <input
                  type="number"
                  name="pricePerWeek"
                  value={formData.pricePerWeek}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Deposit ($)</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAvailable"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Available for rent
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Link
                href="/dashboard/equipment"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
