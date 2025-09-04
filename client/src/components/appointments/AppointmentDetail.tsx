import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PhoneIcon, 
  UserIcon, 
  ClockIcon, 
  MapPinIcon,
  CheckIcon,
  EditIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { appointmentApi } from '../../services/appointmentApi';
import { Appointment } from '../../types';
import toast from 'react-hot-toast';

export const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppointment(id);
    }
  }, [id]);

  const loadAppointment = async (appointmentId: string) => {
    setIsLoading(true);
    try {
      const data = await appointmentApi.getAppointmentById(appointmentId);
      setAppointment(data);
    } catch (error) {
      console.error('Failed to load appointment:', error);
      toast.error('加载预约详情失败');
      navigate('/appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!appointment) return;

    setIsUpdating(true);
    try {
      const response = await appointmentApi.updateAppointmentStatus(
        appointment.id, 
        newStatus as any
      );
      setAppointment(response.appointment);
      toast.success('状态更新成功');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('状态更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    
    if (!confirm('确认取消此预约吗？')) return;

    setIsUpdating(true);
    try {
      await appointmentApi.cancelAppointment(appointment.id);
      toast.success('预约已取消');
      navigate('/appointments');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('取消预约失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <AlertTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">预约不存在</h3>
      </div>
    );
  }

  const statusColor = appointmentApi.getStatusColor(appointment.status);
  const statusText = appointmentApi.getStatusText(appointment.status);
  
  const canMarkArrived = appointment.status === 'CONFIRMED' || appointment.status === 'PENDING';
  const canStartService = appointment.status === 'ARRIVED';
  const canComplete = appointment.status === 'IN_SERVICE';
  const canEdit = !['COMPLETED', 'CANCELLED'].includes(appointment.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/appointments')}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">预约详情</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回功能列表
            </button>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                <span className={`
                  w-2 h-2 rounded-full mr-2
                  ${appointment.status === 'PENDING' ? 'bg-yellow-400' : ''}
                  ${appointment.status === 'CONFIRMED' ? 'bg-blue-400' : ''}
                  ${appointment.status === 'ARRIVED' ? 'bg-green-400' : ''}
                  ${appointment.status === 'IN_SERVICE' ? 'bg-purple-400' : ''}
                  ${appointment.status === 'COMPLETED' ? 'bg-gray-400' : ''}
                  ${appointment.status === 'CANCELLED' ? 'bg-red-400' : ''}
                  ${appointment.status === 'OVERDUE' ? 'bg-orange-400' : ''}
                `} />
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Time */}
        <div className={`px-6 py-4 border-l-4 ${
          appointment.status === 'PENDING' ? 'border-yellow-400 bg-yellow-50' : 
          appointment.status === 'CONFIRMED' ? 'border-blue-400 bg-blue-50' : 
          appointment.status === 'ARRIVED' ? 'border-green-400 bg-green-50' : 
          appointment.status === 'IN_SERVICE' ? 'border-purple-400 bg-purple-50' : 
          appointment.status === 'COMPLETED' ? 'border-gray-400 bg-gray-50' : 
          appointment.status === 'CANCELLED' ? 'border-red-400 bg-red-50' : 
          'border-orange-400 bg-orange-50'
        }`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              今天 {appointmentApi.formatTime(appointment.startTime)}
            </div>
            <div className="text-lg text-gray-600 mt-1">
              {appointmentApi.formatDate(appointment.startTime)}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-lg font-semibold">{appointment.customerName}</span>
                {appointment.member && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    👤 折扣 {appointment.member.memberDiscount === 1 ? '无折扣' : `${Math.round(appointment.member.memberDiscount * 100)}%`}
                  </span>
                )}
              </div>
              <div className="flex items-center text-gray-600">
                <span>{appointment.customerPhone}</span>
                <button className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <PhoneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {appointment.member && (
              <button 
                onClick={() => navigate(`/members/${appointment.member?.id}`)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                会员详情 →
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex space-x-3">
            {canMarkArrived && (
              <button
                onClick={() => handleStatusUpdate('ARRIVED')}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                到店
              </button>
            )}
            
            {canStartService && (
              <button
                onClick={() => handleStatusUpdate('IN_SERVICE')}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                开单
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                完成
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                编辑
              </button>
            )}

            {!['COMPLETED', 'CANCELLED'].includes(appointment.status) && (
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <XIcon className="h-4 w-4 mr-2" />
                取消预约
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-6">
        {/* Service Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">服务详情</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">项目</label>
                <p className="mt-1 text-sm text-gray-900">{appointment.serviceName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">技师</label>
                <p className="mt-1 text-sm text-gray-900">{appointment.staff?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">时长</label>
                <p className="mt-1 text-sm text-gray-900">{appointment.duration}分钟</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(appointment.userNotes || appointment.merchantNotes) && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">备注信息</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {appointment.userNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户备注</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.userNotes}</p>
                </div>
              )}
              {appointment.merchantNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">商家备注</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.merchantNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">预约记录</h3>
          </div>
          <div className="px-6 py-4">
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <UserIcon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">预约创建</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {appointmentApi.formatDateTime(appointment.createdAt)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>客户 {appointment.customerName} 预约了 {appointment.serviceName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                
                {appointment.status !== 'PENDING' && (
                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                            <CheckIcon className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                {appointment.status === 'ARRIVED' ? '客户已到店' :
                                 appointment.status === 'IN_SERVICE' ? '服务开始' :
                                 appointment.status === 'COMPLETED' ? '服务完成' :
                                 appointment.status === 'CANCELLED' ? '预约已取消' :
                                 '状态更新'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {appointmentApi.formatDateTime(appointment.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
