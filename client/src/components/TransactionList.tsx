import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { memberApi } from '../services/memberApi';

interface TransactionListProps {
  memberId: string;
  transactions: Transaction[];
  onTransactionUpdate?: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  memberId,
  transactions: initialTransactions,
  onTransactionUpdate,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'RECHARGE' | 'CONSUME' | 'REFUND'>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (resetList = false) => {
    try {
      setLoading(true);
      const currentPage = resetList ? 1 : page;
      const response = await memberApi.getMemberTransactions(memberId, {
        page: currentPage,
        limit: 20,
        type: filter === 'ALL' ? undefined : filter
      });

      if (resetList) {
        setTransactions(response.transactions);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...response.transactions]);
      }

      setHasMore(response.transactions.length === 20);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    fetchTransactions(true);
  }, [filter, memberId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchTransactions();
    }
  };

  const getTransactionTypeText = (type: string) => {
    const types = {
      RECHARGE: '充值',
      CONSUME: '消费',
      REFUND: '退款'
    } as const;
    return types[type as keyof typeof types] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      RECHARGE: 'text-green-600 bg-green-50',
      CONSUME: 'text-red-600 bg-red-50',
      REFUND: 'text-orange-600 bg-orange-50'
    } as const;
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getPaymentMethodText = (method?: string) => {
    if (!method) return '';
    const methods = {
      CASH: '现金',
      CARD: '刷卡',
      ALIPAY: '支付宝',
      WECHAT: '微信支付',
      BALANCE: '余额'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatAmount = (amount: number, type: string) => {
    const absAmount = Math.abs(amount);
    const sign = type === 'RECHARGE' || type === 'REFUND' ? '+' : '-';
    return `${sign}¥${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">会员记录</h3>
        
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['ALL', 'RECHARGE', 'CONSUME', 'REFUND'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === filterType
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filterType === 'ALL' ? '全部' : getTransactionTypeText(filterType)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无记录</p>
          </div>
        ) : (
          <>
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {/* Transaction type badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.type === 'RECHARGE' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.897-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {transaction.type === 'CONSUME' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {transaction.type === 'REFUND' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    )}
                  </div>

                  {/* Transaction details */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {getTransactionTypeText(transaction.type)}
                      </span>
                      {transaction.paymentMethod && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {getPaymentMethodText(transaction.paymentMethod)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                      {transaction.operatorName && ` • 操作员: ${transaction.operatorName}`}
                    </p>
                  </div>
                </div>

                {/* Amount and balance */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.type === 'RECHARGE' || transaction.type === 'REFUND'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                  <p className="text-sm text-gray-500">
                    余额: ¥{transaction.balanceAfter.toFixed(2)}
                  </p>
                  {/* 积分显示已移除 */}
                </div>
              </div>
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
