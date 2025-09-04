import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MemberDetail from './pages/MemberDetail'
import MemberList from './pages/MemberList'
import MemberRegister from './pages/MemberRegister'
import { Appointments } from './pages/Appointments'
import { AppointmentDetail } from './components/appointments/AppointmentDetail'
import { EditAppointment } from './components/appointments/EditAppointment'
import { Services } from './pages/Services'
import { CreateService, EditService } from './components/services/ServiceForm'
import { ServiceDetail } from './components/services/ServiceDetail'
import './App.css'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💅 美甲店会员管理系统
          </h1>
          <p className="text-gray-600">
            专业的美甲店会员、预约、服务管理平台
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">会员管理</h3>
              <p className="text-gray-600 mb-4">管理会员信息、折扣与余额</p>
              <Link 
                to="/members" 
                className="inline-block bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
              >
                会员列表
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">预约管理</h3>
              <p className="text-gray-600 mb-4">安排和管理客户预约</p>
              <Link 
                to="/appointments" 
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                查看预约
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">服务管理</h3>
              <p className="text-gray-600 mb-4">管理服务项目和价格</p>
              <Link 
                to="/services" 
                className="inline-block bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                服务管理
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">员工管理</h3>
              <p className="text-gray-600 mb-4">管理员工信息和排班</p>
              <button className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">
                员工设置
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">产品管理</h3>
              <p className="text-gray-600 mb-4">管理产品库存和销售</p>
              <button className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">
                产品库存
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">交易统计</h3>
              <p className="text-gray-600 mb-4">查看收入和交易记录</p>
              <button className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">
                查看统计
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center mt-12 text-gray-500">
          <p>© 2024 美甲店会员管理系统 - 专业版</p>
        </footer>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/members/register" element={<MemberRegister />} />
        <Route path="/member/:id" element={<MemberDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/:id/edit" element={<EditAppointment />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/create" element={<CreateService />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/services/:id/edit" element={<EditService />} />
      </Routes>
    </Router>
  )
}

export default App
