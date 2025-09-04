import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceApi } from '../../services/serviceApi';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '../../types';
import toast from 'react-hot-toast';

const serviceSchema = z.object({
  name: z.string().min(1, '服务项目名称不能为空'),
  price: z.number().positive('价格必须大于0'),
  category: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().positive('时长必须大于0').optional().default(180),
});

type ServiceForm = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  mode: 'create' | 'edit';
}

export const ServiceFormComponent: React.FC<ServiceFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      duration: 180,
    },
  });

  const watchCategory = watch('category');

  // Load service data for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadService(id);
    }
  }, [mode, id]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const data = await serviceApi.getServiceById(serviceId);
      setService(data);
      reset({
        name: data.name,
        price: data.price,
        category: data.category || '',
        description: data.description || '',
        duration: data.duration,
      });

      // Check if category is custom (not in predefined list)
      if (data.category && !categories.includes(data.category)) {
        setShowCustomCategory(true);
      }
    } catch (error) {
      console.error('Failed to load service:', error);
      toast.error('加载服务项目失败');
      navigate('/services');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await serviceApi.getServiceCategories();
      setCategories(response);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const onSubmit = async (data: ServiceForm) => {
    setIsLoading(true);
    try {
      // If custom category is being used, use the custom input value
      const formData = {
        ...data,
        category: showCustomCategory ? data.category : (data.category || undefined),
      };

      if (mode === 'create') {
        await serviceApi.createService(formData as CreateServiceRequest);
        toast.success('服务项目创建成功');
      } else if (mode === 'edit' && id) {
        await serviceApi.updateService(id, formData as UpdateServiceRequest);
        toast.success('服务项目更新成功');
      }
      navigate('/services');
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedCategories = [
    '基础护理',
    '美甲设计',
    '艺术美甲',
    '修护保养',
    '特色服务',
  ];

  if (mode === 'edit' && !service && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/services')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? '新增服务项目' : '编辑服务项目'}
              </h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-6">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务项目名称 *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="请输入服务项目名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务价格 *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ¥
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务时长（分钟）
              </label>
              <select
                {...register('duration', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30分钟</option>
                <option value={60}>60分钟</option>
                <option value={90}>90分钟</option>
                <option value={120}>120分钟</option>
                <option value={150}>150分钟</option>
                <option value={180}>180分钟</option>
                <option value={210}>210分钟</option>
                <option value={240}>240分钟</option>
                <option value={270}>270分钟</option>
                <option value={300}>300分钟</option>
              </select>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务分类
              </label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!showCustomCategory}
                      onChange={() => setShowCustomCategory(false)}
                      className="mr-2"
                    />
                    选择预设分类
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={showCustomCategory}
                      onChange={() => setShowCustomCategory(true)}
                      className="mr-2"
                    />
                    自定义分类
                  </label>
                </div>

                {!showCustomCategory ? (
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择分类</option>
                    {predefinedCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    {...register('category')}
                    placeholder="请输入自定义分类"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务描述
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="请输入服务项目的详细描述（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '保存中...' : mode === 'create' ? '创建服务' : '更新服务'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Create and Edit page components
export const CreateService: React.FC = () => (
  <ServiceFormComponent mode="create" />
);

export const EditService: React.FC = () => (
  <ServiceFormComponent mode="edit" />
);