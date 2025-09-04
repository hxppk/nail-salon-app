import React, { useState } from 'react';
import { RechargeRequest } from '../types';
import { memberApi } from '../services/memberApi';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberId: string;
  memberName: string;
}

const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  memberName,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RechargeRequest['paymentMethod']>('CASH');
  const [giftAmount, setGiftAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    const giftNum = parseFloat(giftAmount || '0') || 0;
    if (!amountNum || amountNum <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    if (amountNum > 50000) {
      setError('单次充值金额不能超过50000元');
      return;
    }

    const request: RechargeRequest = {
      amount: amountNum,
      giftAmount: giftNum,
      paymentMethod,
      description: description || undefined,
      operatorName: operatorName || undefined,
    };

    try {
      setLoading(true);
      setError(null);
      await memberApi.rechargeBalance(memberId, request);
      
      // Reset form
      setAmount('');
      setDescription('');
      setGiftAmount('0');
      setOperatorName('');
      setPaymentMethod('CASH');
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '充值失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      CASH: '现金',
      CARD: '刷卡',
      ALIPAY: '支付宝',
      WECHAT: '微信支付'
    };
    return methods[method as keyof typeof methods] || method;
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
        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="sm:flex sm:items-start">
            <div className="w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  会员充值
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

              {/* Member info */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-600 mb-1">会员信息</p>
                <p className="text-lg font-semibold text-purple-900">{memberName}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Amount input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    充值金额（充值余额）<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="请输入充值金额"
                    step="0.01"
                    min="0.01"
                    max="50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    required
                  />
                  
                  {/* Quick amount buttons */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">快速选择：</p>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          onClick={() => handleQuickAmount(quickAmount)}
                          className="px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-md text-sm transition-colors"
                        >
                          ¥{quickAmount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gift amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    赠金金额（可选）
                  </label>
                  <input
                    type="number"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    placeholder="请输入赠金金额（可为 0）"
                    step="0.01"
                    min="0"
                    max="50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Payment method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支付方式 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['CASH', 'CARD', 'ALIPAY', 'WECHAT'] as const).map((method) => (
                      <label
                        key={method}
                        className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === method
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="sr-only"
                        />
                        <span className="font-medium">{getPaymentMethodText(method)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注说明
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请输入备注说明（可选）"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                {/* Operator name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    操作员
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="请输入操作员姓名（可选）"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-3">
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
                        充值中...
                      </>
                    ) : (
                      '确认充值'
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

export default RechargeModal;
