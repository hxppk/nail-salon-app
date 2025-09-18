import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Member, MemberStats, Transaction } from '../types';
import { memberApi } from '../services/memberApi';
import RechargeModal from '../components/RechargeModal';
import MemberEditModal from '../components/MemberEditModal';
import TransactionList from '../components/TransactionList';

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchMemberData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [memberData, statsData, transactionData] = await Promise.all([
        memberApi.getMemberById(id),
        memberApi.getMemberStats(id),
        memberApi.getMemberTransactions(id, { limit: 10 })
      ]);

      setMember(memberData);
      setStats(statsData);
      setTransactions(transactionData.transactions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const handleRechargeSuccess = () => {
    fetchMemberData();
    setShowRechargeModal(false);
  };

  const handleEditSuccess = () => {
    fetchMemberData();
    setShowEditModal(false);
  };

  const getDiscountText = (discount: number) => {
    if (discount >= 1.0) return '无折扣';
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
    if (discount >= 1.0) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    } else if (discount >= 0.9) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">错误: {error}</div>
      </div>
    );
  }

  if (!member || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">会员信息未找到</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">会员详情</h1>
          <div></div>
        </div>

        {/* Member Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h2>
              <p className="text-gray-600 mb-2">{member.phone}</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDiscountColor(member.memberDiscount)}`}>
                会员折扣: {getDiscountText(member.memberDiscount)}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                编辑
              </button>
              <button
                onClick={() => setShowRechargeModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                充值
              </button>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">充值余额</p>
                <p className="text-2xl font-bold text-green-600">¥{member.rechargeBalance.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">赠金余额</p>
                <p className="text-2xl font-bold text-orange-600">¥{member.bonusBalance.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">现金消费</p>
                <p className="text-2xl font-bold text-purple-600">¥{stats.cashSpent.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">消费次数</p>
                <p className="text-2xl font-bold text-orange-600">{stats.visitCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">最近消费时间</p>
                <p className="text-lg font-bold text-gray-800">
                  {stats.lastVisit ? 
                    new Date(stats.lastVisit).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : '暂无'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <TransactionList 
          memberId={id!} 
          transactions={transactions}
          onTransactionUpdate={fetchMemberData}
        />

        {/* Recharge Modal */}
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          onSuccess={handleRechargeSuccess}
          memberId={id!}
          memberName={member.name}
        />

        {/* Edit Modal */}
        <MemberEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          member={member}
        />
      </div>
    </div>
  );
};

export default MemberDetail;