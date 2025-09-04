import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XIcon, UserIcon, PhoneIcon, ArrowLeftIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appointmentApi } from '../../services/appointmentApi';
import { memberApi } from '../../services/memberApi';
import { serviceApi } from '../../services/serviceApi';
import { Appointment, StaffMember, Member } from '../../types';
import toast from 'react-hot-toast';

const updateAppointmentSchema = z.object({
  memberId: z.string().optional(),
  staffId: z.string().min(1, '请选择技师'),
  customerName: z.string().min(1, '请输入客户姓名'),
  customerPhone: z.string().min(1, '请输入手机号'),
  customerGender: z.enum(['MALE', 'FEMALE']).optional(),
  guestCount: z.number().min(1, '至少1位客人'),
  startTime: z.string().min(1, '请选择预约时间'),
  serviceName: z.string().min(1, '请输入服务项目'),
  duration: z.number().min(30, '服务时长至少30分钟'),
  userNotes: z.string().optional(),
  merchantNotes: z.string().optional(),
});

type UpdateAppointmentForm = z.infer<typeof updateAppointmentSchema>;

export const EditAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [phoneNumberType, setPhoneNumberType] = useState<'real' | 'virtual'>('real');
  const [services, setServices] = useState<{ id: string; name: string; duration: number; price: number; category?: string }[]>([]);
  const [serviceQuery, setServiceQuery] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateAppointmentForm>({
    resolver: zodResolver(updateAppointmentSchema),
  });

  const watchGuestCount = watch('guestCount');

  // Load appointment data
  useEffect(() => {
    if (id) {
      loadAppointment(id);
    }
  }, [id]);

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffData = await appointmentApi.getAvailableStaff();
        setStaff(staffData);
      } catch (error) {
        console.error('Failed to load staff:', error);
        toast.error('加载技师列表失败');
      }
    };

    loadStaff();
  }, []);

  // Search members
  useEffect(() => {
    const searchMembers = async () => {
      if (searchMemberQuery.length >= 2) {
        try {
          const response = await memberApi.getMembers({
            search: searchMemberQuery,
            limit: 10,
          });
          setMembers(response.members);
        } catch (error) {
          console.error('Failed to search members:', error);
        }
      } else {
        setMembers([]);
      }
    };

    const timeoutId = setTimeout(searchMembers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchMemberQuery]);

  // Load appointment and populate form
  const loadAppointment = async (appointmentId: string) => {
    setIsLoading(true);
    try {
      const data = await appointmentApi.getAppointmentById(appointmentId);
      setAppointment(data);
      
      // Format the startTime for datetime-local input
      const startTime = new Date(data.startTime);
      const formattedStartTime = startTime.toISOString().slice(0, 16);
      
      // Populate form with appointment data
      reset({
        memberId: data.memberId || '',
        staffId: data.staff?.id || '',
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerGender: data.customerGender as 'MALE' | 'FEMALE' || undefined,
        guestCount: data.guestCount,
        startTime: formattedStartTime,
        serviceName: data.serviceName,
        duration: data.duration,
        userNotes: data.userNotes || '',
        merchantNotes: data.merchantNotes || '',
      });

      // Set member-related states
      if (data.member) {
        setSelectedMember(data.member);
        setIsNewMember(false);
      } else {
        setSelectedMember(null);
        setIsNewMember(true);
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
      toast.error('加载预约详情失败');
      navigate('/appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setValue('memberId', member.id);
    setValue('customerName', member.name);
    setValue('customerPhone', member.phone);
    setValue('customerGender', member.gender as 'MALE' | 'FEMALE');
    setSearchMemberQuery('');
    setIsNewMember(false);
  };

  const handleNewMemberToggle = () => {
    setIsNewMember(!isNewMember);
    setSelectedMember(null);
    setValue('memberId', '');
    if (!isNewMember) {
      // Keep current values when switching to new member
      // Don't clear since user might want to keep the data
    }
  };

  const onSubmit = async (data: UpdateAppointmentForm) => {
    if (!appointment) return;
    
    setIsLoading(true);
    try {
      const appointmentData = {
        ...data,
        maleGuests: 0,
        femaleGuests: data.guestCount,
        startTime: new Date(data.startTime).toISOString(),
      };

      await appointmentApi.updateAppointment(appointment.id, appointmentData);
      toast.success('预约更新成功');
      navigate(`/appointments/${appointment.id}`);
    } catch (error) {
      console.error('Failed to update appointment:', error);
      toast.error(error instanceof Error ? error.message : '更新预约失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Search services
  useEffect(() => {
    const searchServices = async () => {
      const q = serviceQuery || watch('serviceName');
      if (!q || q.length < 1) {
        setServices([]);
        return;
      }
      try {
        const resp = await serviceApi.getServices({ search: q, limit: 8 });
        setServices(resp.services || []);
      } catch (e) {
        // silent
      }
    };
    const t = setTimeout(searchServices, 250);
    return () => clearTimeout(t);
  }, [serviceQuery, watch]);

  const handleServiceSelect = (svc: { name: string; duration: number }) => {
    setValue('serviceName', svc.name);
    if (svc.duration) setValue('duration', svc.duration as any);
    setServiceQuery('');
    setServices([]);
  };

  if (isLoading && !appointment) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">预约不存在</h3>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/appointments/${appointment.id}`)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">编辑预约</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回功能列表
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客户类型
            </label>
            <div className="flex space-x-4 mb-3">
              <button
                type="button"
                onClick={() => setIsNewMember(false)}
                className={`px-3 py-2 text-sm rounded-md border ${
                  !isNewMember ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300'
                }`}
              >
                现有会员
              </button>
              <button
                type="button"
                onClick={handleNewMemberToggle}
                className={`px-3 py-2 text-sm rounded-md border ${
                  isNewMember ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300'
                }`}
              >
                非会员/新会员
              </button>
            </div>

            {!isNewMember && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索会员姓名或手机号..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {members.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMemberSelect(member)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                      >
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedMember && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <div className="font-medium">{selectedMember.name}</div>
                    <div className="text-sm text-gray-600">{selectedMember.phone}</div>
                    <div className="text-sm text-gray-600">
                      折扣: {selectedMember.memberDiscount === 1 ? '无折扣' : `${Math.round(selectedMember.memberDiscount * 100)}%`} | 余额: ¥{selectedMember.balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客户姓名 *
              </label>
              <input
                type="text"
                {...register('customerName')}
                disabled={!!selectedMember}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 *
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('customerPhone')}
                  disabled={!!selectedMember}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <PhoneIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {!selectedMember && (
                <div className="mt-1 flex space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPhoneNumberType('real')}
                    className={`px-2 py-1 rounded ${
                      phoneNumberType === 'real' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    真实手机号
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneNumberType('virtual')}
                    className={`px-2 py-1 rounded ${
                      phoneNumberType === 'virtual' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    虚拟号
                  </button>
                </div>
              )}
              {errors.customerPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性别
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('customerGender')}
                  value="FEMALE"
                  className="mr-2"
                />
                女
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('customerGender')}
                  value="MALE"
                  className="mr-2"
                />
                男
              </label>
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              顾客人数
            </label>
            <input
              type="number"
              {...register('guestCount', { valueAsNumber: true })}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Appointment Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到店时间 *
            </label>
            <input
              type="datetime-local"
              {...register('startTime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>

          {/* Service and Staff */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务项目 *
              </label>
              <input
                type="text"
                {...register('serviceName')}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder="如：独立款式设计"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.serviceName && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceName.message}</p>
              )}
              {services.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleServiceSelect(s)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.duration}分钟 · ¥{s.price.toFixed(2)}</div>
                      </div>
                      {s.category && <div className="text-xs text-gray-400 mt-0.5">{s.category}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                技师 *
              </label>
              <select
                {...register('staffId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择技师</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.staffId && (
                <p className="mt-1 text-sm text-red-600">{errors.staffId.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时长（分钟）
            </label>
            <select
              {...register('duration', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>30分钟</option>
              <option value={60}>60分钟</option>
              <option value={120}>120分钟</option>
              <option value={180}>180分钟</option>
              <option value={240}>240分钟</option>
              <option value={300}>300分钟</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户备注
            </label>
            <textarea
              {...register('userNotes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="客户的特殊要求或备注..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商家备注
            </label>
            <textarea
              {...register('merchantNotes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="商家内部备注..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/appointments/${appointment.id}`)}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '更新中...' : '更新预约'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
