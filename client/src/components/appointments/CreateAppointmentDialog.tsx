import React, { useState, useEffect } from 'react';
import { XIcon, UserIcon, PhoneIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appointmentApi } from '../../services/appointmentApi';
import { memberApi } from '../../services/memberApi';
import { CreateAppointmentRequest, StaffMember, Member } from '../../types';
import toast from 'react-hot-toast';

const createAppointmentSchema = z.object({
  memberId: z.string().optional(),
  staffId: z.string().min(1, '请选择技师'),
  customerName: z.string().min(1, '请输入客户姓名'),
  customerPhone: z.string().min(1, '请输入手机号'),
  customerGender: z.enum(['MALE', 'FEMALE']).optional(),
  guestCount: z.number().min(1, '至少1位客人'),
  startTime: z.string().min(1, '请选择预约时间'),
  serviceName: z.string().min(1, '请输入服务项目'),
  duration: z.number().min(30, '服务时长至少30分钟'),
  notes: z.string().optional(),
  userNotes: z.string().optional(),
  merchantNotes: z.string().optional(),
});

type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;

interface CreateAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string; // YYYY-MM-DD
  defaultTime?: string; // HH:mm
}

export const CreateAppointmentDialog: React.FC<CreateAppointmentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultTime,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [phoneNumberType, setPhoneNumberType] = useState<'real' | 'virtual'>('real');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      guestCount: 1,
      maleGuests: 0,
      femaleGuests: 1,
      duration: 180,
      source: 'MANUAL',
      startTime: defaultDate && defaultTime ? `${defaultDate}T${defaultTime}:00` : '',
    },
  });

  const watchGuestCount = watch('guestCount');

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

    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

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


  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && staff.length > 0) {
      // Find 青山's staff ID as default, fallback to first staff member
      const qingshanStaff = staff.find(s => s.name === '青山') || staff[0];
      
      reset({
        guestCount: 1,
        duration: 180,
        staffId: qingshanStaff.id,
        startTime: defaultDate && defaultTime ? `${defaultDate}T${defaultTime}:00` : '',
      });
      setSelectedMember(null);
      setIsNewMember(false);
      setSearchMemberQuery('');
    }
  }, [isOpen, defaultDate, defaultTime, reset, staff]);

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
      // Clear member-related fields when switching to new member
      setValue('customerName', '');
      setValue('customerPhone', '');
      setValue('customerGender', undefined);
    }
  };

  const onSubmit = async (data: CreateAppointmentForm) => {
    setIsLoading(true);
    try {
      const appointmentData: CreateAppointmentRequest = {
        ...data,
        maleGuests: 0,
        femaleGuests: data.guestCount,
        source: 'MANUAL',
        startTime: new Date(data.startTime).toISOString(),
      };

      await appointmentApi.createAppointment(appointmentData);
      toast.success('预约创建成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast.error(error instanceof Error ? error.message : '创建预约失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  新增预约
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
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
                            {selectedMember.membershipLevel} 会员 | 余额: ¥{selectedMember.balance}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      服务项目 *
                    </label>
                    <input
                      type="text"
                      {...register('serviceName')}
                      placeholder="如：独立款式设计"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.serviceName && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceName.message}</p>
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
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? '创建中...' : '创建预约'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};