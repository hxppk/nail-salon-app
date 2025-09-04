import React, { useEffect, useState } from 'react'
import { Member } from '../types'
import { memberApi } from '../services/memberApi'

interface MemberEditModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member
  onUpdated: () => void
}

const discountOptions: Array<{ value: Member['memberDiscount']; label: string }> = [
  { value: 1, label: '无折扣' },
  { value: 0.9, label: '9折' },
  { value: 0.88, label: '88折' },
  { value: 0.85, label: '85折' },
  { value: 0.8, label: '8折' },
  { value: 0.75, label: '75折' },
  { value: 0.7, label: '7折' },
]

const MemberEditModal: React.FC<MemberEditModalProps> = ({ isOpen, onClose, member, onUpdated }) => {
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone,
    email: member.email || '',
    birthday: member.birthday ? member.birthday.slice(0, 10) : '',
    gender: member.gender || '',
    address: member.address || '',
    memberDiscount: member.memberDiscount,
    notes: member.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: member.name,
        phone: member.phone,
        email: member.email || '',
        birthday: member.birthday ? member.birthday.slice(0, 10) : '',
        gender: member.gender || '',
        address: member.address || '',
        memberDiscount: member.memberDiscount,
        notes: member.notes || '',
      })
      setError(null)
    }
  }, [isOpen, member])

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await memberApi.updateMember(member.id, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        birthday: form.birthday || undefined,
        gender: (form.gender || undefined) as any,
        address: form.address || undefined,
        memberDiscount: form.memberDiscount,
        notes: form.notes || undefined,
      } as any)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">编辑会员资料</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                  <input type="date" value={form.birthday} onChange={(e) => handleChange('birthday', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">未设置</option>
                    <option value="FEMALE">女</option>
                    <option value="MALE">男</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">会员折扣</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {discountOptions.map((opt) => (
                    <label key={opt.value} className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${form.memberDiscount === opt.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" value={opt.value} checked={form.memberDiscount === opt.value} onChange={(e) => handleChange('memberDiscount', Number(e.target.value))} className="sr-only" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>
              )}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50">取消</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50">保存</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberEditModal
