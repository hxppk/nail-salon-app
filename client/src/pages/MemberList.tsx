import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Member, MemberListFilters } from '../types';
import { memberApi } from '../services/memberApi';

const MemberList: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<MemberListFilters>({
    page: 1,
    limit: 20,
    search: '',
    membershipLevel: '',
    balanceStatus: '',
    registrationPeriod: '',
    activityStatus: '',
    spendingLevel: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberApi.getMembers(filters);
      setMembers(response.members);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [filters]);

  const handleFilterChange = (key: keyof MemberListFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 when changing filters
    }));
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange('page', newPage);
  };

  const getMembershipLevelText = (level: string) => {
    const levels = {
      BRONZE: '铜牌',
      SILVER: '银牌',
      GOLD: '金牌',
      PLATINUM: '白金'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getMembershipLevelColor = (level: string) => {
    switch (level) {
      case 'BRONZE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SILVER':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'GOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastVisit = (dateString?: string) => {
    if (!dateString) return '从未消费';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '今天';
    if (diffInDays === 1) return '昨天';
    if (diffInDays < 7) return `${diffInDays}天前`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`;
    return `${Math.floor(diffInDays / 365)}年前`;
  };

  const generateAvatar = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const FilterSection = () => (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 space-y-4">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索会员姓名或手机号..."
            value={filters.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <Link
          to="/members/register"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增会员
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <select
          value={filters.membershipLevel || ''}
          onChange={(e) => handleFilterChange('membershipLevel', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="">全部等级</option>
          <option value="BRONZE">铜牌会员</option>
          <option value="SILVER">银牌会员</option>
          <option value="GOLD">金牌会员</option>
          <option value="PLATINUM">白金会员</option>
        </select>

        <select
          value={filters.balanceStatus || ''}
          onChange={(e) => handleFilterChange('balanceStatus', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="">余额状态</option>
          <option value="has_balance">有余额</option>
          <option value="no_balance">无余额</option>
          <option value="has_debt">有欠款</option>
        </select>

        <select
          value={filters.registrationPeriod || ''}
          onChange={(e) => handleFilterChange('registrationPeriod', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="">注册时间</option>
          <option value="this_month">本月新增</option>
          <option value="last_3_months">近3个月</option>
          <option value="this_year">今年注册</option>
        </select>

        <select
          value={filters.activityStatus || ''}
          onChange={(e) => handleFilterChange('activityStatus', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="">活跃度</option>
          <option value="active">活跃会员</option>
          <option value="dormant">沉睡会员</option>
        </select>

        <select
          value={filters.spendingLevel || ''}
          onChange={(e) => handleFilterChange('spendingLevel', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="">消费水平</option>
          <option value="high">高消费(&gt;5000)</option>
          <option value="medium">中消费(1000-5000)</option>
          <option value="low">低消费(&lt;1000)</option>
        </select>

        <select
          value={filters.sortBy || 'createdAt'}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="createdAt">注册时间</option>
          <option value="name">姓名</option>
          <option value="totalSpent">总消费</option>
          <option value="balance">余额</option>
          <option value="lastVisit">最近访问</option>
        </select>
      </div>

      {/* Clear filters button */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setFilters({
            page: 1,
            limit: 20,
            search: '',
            membershipLevel: '',
            balanceStatus: '',
            registrationPeriod: '',
            activityStatus: '',
            spendingLevel: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          清除筛选
        </button>
        <p className="text-sm text-gray-500">
          共找到 {pagination.total} 名会员
        </p>
      </div>
    </div>
  );

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 text-lg">{error}</p>
          <button 
            onClick={fetchMembers}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">会员管理</h1>
          <div></div>
        </div>

        {/* Filter Section */}
        <FilterSection />

        {/* Member Cards */}
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-lg mb-4">暂无会员数据</p>
            <Link
              to="/members/register"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加第一个会员
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/member/${member.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 group"
                >
                  {/* Member Avatar and Basic Info */}
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 ${generateAvatar(member.name)}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{member.phone}</p>
                    </div>
                  </div>

                  {/* Membership Level */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMembershipLevelColor(member.membershipLevel)}`}>
                      {getMembershipLevelText(member.membershipLevel)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">余额:</span>
                      <span className={`font-medium ${member.balance > 0 ? 'text-green-600' : member.debtAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ¥{member.balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">总消费:</span>
                      <span className="font-medium text-gray-900">¥{member.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">积分:</span>
                      <span className="font-medium text-blue-600">{member.points}</span>
                    </div>
                  </div>

                  {/* Last Visit */}
                  <div className="text-xs text-gray-400 border-t pt-3">
                    <div className="flex justify-between">
                      <span>最近访问:</span>
                      <span>{formatLastVisit(member.lastVisit)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>注册时间:</span>
                      <span>{formatDate(member.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <span>
                  显示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                  共 {pagination.total} 条记录
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-md text-sm ${
                          pageNum === pagination.page
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemberList;