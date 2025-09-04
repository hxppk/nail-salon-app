import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  TagIcon,
  CurrencyYenIcon,
  CalendarIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { serviceApi } from '../../services/serviceApi';
import { Service } from '../../types';
import toast from 'react-hot-toast';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadService(id);
    }
  }, [id]);

  const loadService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const data = await serviceApi.getServiceById(serviceId);
      setService(data);
    } catch (error) {
      console.error('Failed to load service:', error);
      toast.error('加载服务项目详情失败');
      navigate('/services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;

    if (!confirm(`确定要删除服务项目"${service.name}"吗？\n注意：如果该服务已被使用，将无法删除。`)) {
      return;
    }

    try {
      await serviceApi.deleteService(service.id);
      toast.success('服务项目删除成功');
      navigate('/services');
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error(error instanceof Error ? error.message : '删除服务项目失败');
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;

    try {
      await serviceApi.updateService(service.id, { isActive: !service.isActive });
      toast.success(`服务项目已${service.isActive ? '停用' : '启用'}`);
      setService({ ...service, isActive: !service.isActive });
    } catch (error) {
      console.error('Failed to update service status:', error);
      toast.error('更新服务状态失败');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">服务项目不存在</h3>
            <div className="mt-6">
              <button
                onClick={() => navigate('/services')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                返回服务列表
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/services')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">服务项目详情</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${serviceApi.getStatusColor(
                    service.isActive
                  )} hover:opacity-80`}
                >
                  {serviceApi.getStatusText(service.isActive)}
                </button>
                <button
                  onClick={() => navigate(`/services/${service.id}/edit`)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  删除
                </button>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <CurrencyYenIcon className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">服务价格</p>
                      <p className="text-2xl font-bold text-green-600">
                        {serviceApi.formatPrice(service.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">服务时长</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {serviceApi.formatDuration(service.duration)}
                      </p>
                    </div>
                  </div>
                </div>

                {service.category && (
                  <div className="mt-6 flex items-center">
                    <TagIcon className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">服务分类</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${serviceApi.getCategoryColor(
                          service.category
                        )} mt-1`}
                      >
                        {service.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Dates */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">状态信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">当前状态</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${serviceApi.getStatusColor(
                          service.isActive
                        )} mt-1`}
                      >
                        {serviceApi.getStatusText(service.isActive)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">创建信息</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">创建时间</p>
                        <p className="text-sm text-gray-900">
                          {new Date(service.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">更新时间</p>
                        <p className="text-sm text-gray-900">
                          {new Date(service.updatedAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics (placeholder for future implementation) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">使用统计</h3>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">
              使用统计功能将在后续版本中提供，包括预约次数、收入统计等。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};