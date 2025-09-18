import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { memberApi } from '../services/memberApi';

interface MemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member;
}

interface UpdateMemberData {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  memberDiscount: number;
  notes?: string;
}

const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
  const [formData, setFormData] = useState<UpdateMemberData>({
    name: member.name,
    phone: member.phone,
    email: member.email || '',
    birthday: member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '',
    gender: member.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
    address: member.address || '',
    memberDiscount: member.memberDiscount,
    notes: member.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        phone: member.phone,
        email: member.email || '',
        birthday: member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '',
        gender: member.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        address: member.address || '',
        memberDiscount: member.memberDiscount,
        notes: member.notes || '',
      });
    }
  }, [member]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = '姓名是必填项';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '姓名至少需要2个字符';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = '手机号是必填项';
    } else {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = '手机号格式不正确';
      }
    }

    // Validate email
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '邮箱格式不正确';
      }
    }

    // Validate birthday
    if (formData.birthday) {
      const birthday = new Date(formData.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthday.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.birthday = '请输入有效的出生日期（16-100岁）';
      }
    }

    // Validate member discount
    const validDiscounts = [0.9, 0.88, 0.85, 0.8, 0.75, 0.7];
    if (!formData.memberDiscount || !validDiscounts.includes(formData.memberDiscount)) {
      newErrors.memberDiscount = '请选择有效的会员折扣';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      await memberApi.updateMember(member.id, {
        ...formData,
        email: formData.email || undefined,
        birthday: formData.birthday || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: '更新失败，请稍后重试' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateMemberData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getDiscountText = (discount: number) => {
    const discountMap = {
      0.9: '9折',
      0.88: '88折',
      0.85: '85折',
      0.8: '8折',
      0.75: '75折',
      0.7: '7折'
    };
    return discountMap[discount as keyof typeof discountMap] || `${Math.round(discount * 100)}折`;
  };

  const getDiscountColor = (discount: number) => {
    if (discount >= 0.9) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (discount >= 0.85) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (discount >= 0.8) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (discount >= 0.75) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-[90vh] overflow-y-auto">
          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  编辑会员信息
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入会员姓名"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="请输入11位手机号"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="请输入邮箱地址（可选）"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Birthday and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      出生日期
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        errors.birthday ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.birthday && <p className="text-red-500 text-sm mt-1">{errors.birthday}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性别
                    </label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="">请选择</option>
                      <option value="FEMALE">女</option>
                      <option value="MALE">男</option>
                      <option value="OTHER">其他</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    地址
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="请输入联系地址（可选）"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Member Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    会员折扣 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {([0.9, 0.88, 0.85, 0.8, 0.75, 0.7] as const).map((discount) => (
                      <label
                        key={discount}
                        className={`relative flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.memberDiscount === discount
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={discount}
                          checked={formData.memberDiscount === discount}
                          onChange={(e) => handleInputChange('memberDiscount', parseFloat(e.target.value))}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getDiscountColor(discount)}`}>
                            {getDiscountText(discount)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.memberDiscount && <p className="text-red-500 text-sm mt-1">{errors.memberDiscount}</p>}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        更新中...
                      </>
                    ) : (
                      '确认更新'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberEditModal;