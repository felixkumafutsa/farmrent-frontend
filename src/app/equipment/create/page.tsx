'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/api';


export default function CreateEquipmentPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
    pricePerWeek: '',
    deposit: '',
    location: '',
    condition: 'EXCELLENT',
    categoryId: '',
    quantity: '1',
    images: [] as string[],
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchCategories();
  }, []);

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
      } else {
        // Mock categories for fallback
        setCategories([
          { id: '1', name: 'Tractors' },
          { id: '2', name: 'Harvesters' },
          { id: '3', name: 'Plows' },
          { id: '4', name: 'Irrigation Systems' },
          { id: '5', name: 'Planters' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Mock categories for fallback
      setCategories([
        { id: '1', name: 'Tractors' },
        { id: '2', name: 'Harvesters' },
        { id: '3', name: 'Plows' },
        { id: '4', name: 'Irrigation Systems' },
        { id: '5', name: 'Planters' },
      ]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = 'Price per day must be greater than 0';
    }

    if (!formData.pricePerWeek || parseFloat(formData.pricePerWeek) <= 0) {
      newErrors.pricePerWeek = 'Price per week must be greater than 0';
    }

    if (!formData.deposit || parseFloat(formData.deposit) < 0) {
      newErrors.deposit = 'Deposit must be 0 or greater';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...formData,
        pricePerDay: parseFloat(formData.pricePerDay),
        pricePerWeek: parseFloat(formData.pricePerWeek),
        deposit: parseFloat(formData.deposit),
        quantity: parseInt(formData.quantity),
        isAvailable: true,
        // Add vendor-specific data if user is a vendor
        ...(user?.role === 'VENDOR' && { vendorId: user.id }),
      };

      const response = await fetch('${API_URL}/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Equipment Created!',
          text: 'Equipment created successfully!',
          confirmButtonColor: '#10b981'
        });
        router.push('/dashboard/equipment');
      } else {
        const errorData = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Creation Failed',
            text: `Failed to create equipment: ${errorData.message || 'Unknown error'}`,
            confirmButtonColor: '#ef4444'
          });
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Creation Error',
        text: 'Failed to create equipment. Please check your connection and try again.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageAdd = () => {
    // Trigger file input click
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: `"${file.name}" is not an image file. Please select only image files.`,
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Check file size (max 2MB for upload)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: `"${file.name}" is too large. Maximum file size is 2MB.`,
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Compress image
      compressImage(file, (compressedImageUrl) => {
        // Limit to 5 images maximum
        if (formData.images.length >= 5) {
          Swal.fire({
            icon: 'warning',
            title: 'Maximum Images',
            text: 'Maximum 5 images allowed. Please remove some images first.',
            confirmButtonColor: '#ef4444'
          });
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, compressedImageUrl],
        }));
      });
    });

    // Reset file input
    e.target.value = '';
  };

  const compressImage = (file: File, callback: (compressedImageUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 800px width/height)
        let { width, height } = img;
        const maxDimension = 800;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed JPEG (quality 0.7)
          const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(compressedImageUrl);
        }
      };
      img.onerror = () => {
        Swal.fire({
          icon: 'error',
          title: 'Processing Failed',
          text: `Failed to process image "${file.name}". Please try again.`,
          confirmButtonColor: '#ef4444'
        });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      Swal.fire({
        icon: 'error',
        title: 'Read Error',
        text: `Failed to read file "${file.name}". Please try again.`,
        confirmButtonColor: '#ef4444'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: `"${file.name}" is not an image file. Please select only image files.`,
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Check file size (max 2MB for upload)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: `"${file.name}" is too large. Maximum file size is 2MB.`,
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      // Compress image
      compressImage(file, (compressedImageUrl) => {
        // Limit to 5 images maximum
        if (formData.images.length >= 5) {
          Swal.fire({
            icon: 'warning',
            title: 'Maximum Images',
            text: 'Maximum 5 images allowed. Please remove some images first.',
            confirmButtonColor: '#ef4444'
          });
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, compressedImageUrl],
        }));
      });
    });
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Equipment</h1>
          <p className="text-gray-600">Add new equipment to the platform</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Equipment Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.name && <p className="mt-2 text-sm font-medium text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.categoryId ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-2 text-sm font-medium text-red-600">{errors.categoryId}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-base font-semibold text-gray-800 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  placeholder="Describe your equipment, its features, working condition, and any other relevant details..."
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.description && <p className="mt-2 text-sm font-medium text-red-600">{errors.description}</p>}
                <p className="mt-2 text-sm text-gray-600 font-medium">Minimum 20 characters</p>
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
                  placeholder="0.00"
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.pricePerDay ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.pricePerDay && <p className="mt-2 text-sm font-medium text-red-600">{errors.pricePerDay}</p>}
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
                  placeholder="0.00"
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.pricePerWeek ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.pricePerWeek && <p className="mt-2 text-sm font-medium text-red-600">{errors.pricePerWeek}</p>}
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
                  placeholder="0.00"
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.deposit ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.deposit && <p className="mt-2 text-sm font-medium text-red-600">{errors.deposit}</p>}
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="1"
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.quantity && <p className="mt-2 text-sm font-medium text-red-600">{errors.quantity}</p>}
                <p className="mt-2 text-sm text-gray-600 font-medium">Number of units available</p>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Lilongwe, Malawi"
                  className={`mt-1 block w-full border rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-green-500 focus:border-green-500 text-base ${
                    errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.location && <p className="mt-2 text-sm font-medium text-red-600">{errors.location}</p>}
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
                <p className="mt-2 text-sm text-gray-600 font-medium">Be honest about the equipment condition</p>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">Equipment Images</label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Select Images
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
              
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Equipment image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    {isDragging ? 'Drop images here...' : 'No images selected yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isDragging 
                      ? 'Release to upload images' 
                      : 'Click "Select Images" or drag and drop photos here'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Supported formats: JPG, PNG, GIF, WebP (max 2MB each, max 5 images)</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Photo Tips:</p>
                    <ul className="mt-1 list-disc list-inside text-blue-600">
                      <li>Take photos in good lighting</li>
                      <li>Show equipment from multiple angles</li>
                      <li>Include any important features or damage</li>
                      <li>Use clear, high-resolution images</li>
                      <li>Images will be automatically compressed for faster upload</li>
                      <li>Maximum 5 images per equipment listing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
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
                {loading ? 'Creating...' : 'Create Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
