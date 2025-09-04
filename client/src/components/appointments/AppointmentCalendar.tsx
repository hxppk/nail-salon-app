import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { appointmentApi } from '../../services/appointmentApi';
import { Appointment, CalendarDay } from '../../types';

interface AppointmentCalendarProps {
  onDateSelect: (date: string) => void;
  onCreateAppointment: (date?: string, time?: string) => void;
  selectedDate?: string;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onDateSelect,
  onCreateAppointment,
  selectedDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  // Get calendar data for current month
  const loadMonthData = async (date: Date) => {
    setIsLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Get start and end dates for the calendar grid
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday

      // Fetch appointments for the entire calendar period
      const appointments = await appointmentApi.getAppointmentsByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Build calendar days
      const days: CalendarDay[] = [];
      const currentDay = new Date(startDate);
      
      while (currentDay <= endDate) {
        const dateString = currentDay.toISOString().split('T')[0];
        const dayAppointments = appointments.filter(apt => {
          const appointmentDate = new Date(apt.startTime);
          const appointmentDateString = appointmentDate.getFullYear() + '-' + 
            String(appointmentDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(appointmentDate.getDate()).padStart(2, '0');
          return appointmentDateString === dateString;
        });

        // Calculate stats for this day
        const stats = {
          pending: dayAppointments.filter(a => a.status === 'PENDING').length,
          confirmed: dayAppointments.filter(a => a.status === 'CONFIRMED').length,
          arrived: dayAppointments.filter(a => a.status === 'ARRIVED').length,
          inService: dayAppointments.filter(a => a.status === 'IN_SERVICE').length,
          completed: dayAppointments.filter(a => a.status === 'COMPLETED').length,
          cancelled: dayAppointments.filter(a => a.status === 'CANCELLED').length,
          overdue: dayAppointments.filter(a => a.status === 'OVERDUE').length,
        };

        days.push({
          date: new Date(currentDay),
          dateString,
          isCurrentMonth: currentDay.getMonth() === month,
          isToday: dateString === new Date().toISOString().split('T')[0],
          appointments: dayAppointments,
          stats,
        });

        currentDay.setDate(currentDay.getDate() + 1);
      }

      setCalendarDays(days);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData(currentDate);
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: CalendarDay) => {
    onDateSelect(day.dateString);
    setViewMode('day');
  };

  const getTotalAppointments = (day: CalendarDay) => {
    return Object.values(day.stats).reduce((sum, count) => sum + count, 0);
  };

  const getStatusIndicators = (day: CalendarDay) => {
    const indicators = [];
    if (day.stats.pending > 0) indicators.push({ type: '待确认', count: day.stats.pending, color: 'bg-yellow-500' });
    if (day.stats.confirmed > 0) indicators.push({ type: '已预约', count: day.stats.confirmed, color: 'bg-blue-500' });
    if (day.stats.arrived > 0) indicators.push({ type: '已到店', count: day.stats.arrived, color: 'bg-green-500' });
    if (day.stats.inService > 0) indicators.push({ type: '服务中', count: day.stats.inService, color: 'bg-purple-500' });
    if (day.stats.completed > 0) indicators.push({ type: '已完成', count: day.stats.completed, color: 'bg-gray-500' });
    if (day.stats.cancelled > 0) indicators.push({ type: '已取消', count: day.stats.cancelled, color: 'bg-red-500' });
    if (day.stats.overdue > 0) indicators.push({ type: '已超时', count: day.stats.overdue, color: 'bg-orange-500' });
    return indicators;
  };

  if (viewMode === 'day' && selectedDate) {
    const selectedDay = calendarDays.find(day => day.dateString === selectedDate);
    if (selectedDay) {
      return (
        <DayView 
          day={selectedDay}
          onBack={() => setViewMode('month')}
          onCreateAppointment={onCreateAppointment}
        />
      );
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            预约日历
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-lg font-medium text-gray-900 min-w-[120px] text-center">
              {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const totalAppointments = getTotalAppointments(day);
            const indicators = getStatusIndicators(day);
            
            return (
              <div
                key={day.dateString}
                onClick={() => handleDateClick(day)}
                className={`
                  relative p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${day.isToday ? 'bg-blue-50 border-blue-500' : ''}
                  ${selectedDate === day.dateString ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="text-sm font-medium">
                  {day.date.getDate()}
                </div>
                
                {totalAppointments > 0 && (
                  <div className="mt-1">
                    <div className="text-xs text-gray-600 mb-1">
                      {totalAppointments} 个预约
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {indicators.slice(0, 3).map((indicator, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${indicator.color}`}
                          title={`${indicator.type}: ${indicator.count}`}
                        />
                      ))}
                      {indicators.length > 3 && (
                        <div className="text-xs text-gray-500">...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span>待确认({calendarDays.reduce((sum, day) => sum + day.stats.pending, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <span>已预约({calendarDays.reduce((sum, day) => sum + day.stats.confirmed, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span>已到店({calendarDays.reduce((sum, day) => sum + day.stats.arrived, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
            <span>服务中({calendarDays.reduce((sum, day) => sum + day.stats.inService, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
            <span>已完成({calendarDays.reduce((sum, day) => sum + day.stats.completed, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span>已取消({calendarDays.reduce((sum, day) => sum + day.stats.cancelled, 0)})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
            <span>已超时({calendarDays.reduce((sum, day) => sum + day.stats.overdue, 0)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Day view component
interface DayViewProps {
  day: CalendarDay;
  onBack: () => void;
  onCreateAppointment: (date?: string, time?: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ day, onBack, onCreateAppointment }) => {
  // Generate time slots from 10:00 to 23:30 in 30-minute intervals
  const timeSlots = [];
  for (let hour = 10; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 23 && minute > 30) break; // Stop at 23:30
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  const getAppointmentForTimeSlot = (time: string, staffName: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotTime = hours * 60 + minutes; // Convert to minutes since midnight
    
    return day.appointments.find(appointment => {
      // Check if this appointment is assigned to this staff member or if we need fallback assignment
      let isAssignedToStaff = false;
      
      if (appointment.staff?.name === staffName) {
        isAssignedToStaff = true;
      } else if (!appointment.staff?.name || appointment.staff?.name === '') {
        // If no staff assigned, assign to 青山 by default
        isAssignedToStaff = (staffName === '青山');
      } else if (appointment.staff?.name !== '青山' && appointment.staff?.name !== '软软') {
        // If staff name is not one of our two staff, assign to 青山 by default
        isAssignedToStaff = (staffName === '青山');
      }
      
      if (!isAssignedToStaff) {
        return false;
      }
      
      const appointmentStart = new Date(appointment.startTime);
      const appointmentStartTime = appointmentStart.getHours() * 60 + appointmentStart.getMinutes();
      const appointmentEndTime = appointmentStartTime + appointment.duration;
      
      // Check if current time slot falls within appointment duration
      return slotTime >= appointmentStartTime && slotTime < appointmentEndTime;
    });
  };

  const isAppointmentStart = (appointment: Appointment, time: string) => {
    const appointmentTime = new Date(appointment.startTime);
    const appointmentTimeString = `${appointmentTime.getHours().toString().padStart(2, '0')}:${appointmentTime.getMinutes().toString().padStart(2, '0')}`;
    return appointmentTimeString === time;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            返回日历
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {day.date.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </h1>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-6 border-b bg-gray-50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{day.stats.pending}</div>
            <div className="text-sm text-gray-600">待确认</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{day.stats.confirmed}</div>
            <div className="text-sm text-gray-600">已预约</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{day.stats.arrived}</div>
            <div className="text-sm text-gray-600">已到店</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{day.stats.inService}</div>
            <div className="text-sm text-gray-600">服务中</div>
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="p-6">
        {/* Column headers */}
        <div className="grid grid-cols-[60px_1fr_1fr] gap-1 mb-2">
          <div></div>
          <div className="text-center font-medium text-gray-700 bg-gray-50 py-2 rounded">青山</div>
          <div className="text-center font-medium text-gray-700 bg-gray-50 py-2 rounded">软软</div>
        </div>

        {/* Time grid */}
        <div className="space-y-1">
          {timeSlots.map((time) => {
            return (
              <div key={time} className="grid grid-cols-[60px_1fr_1fr] gap-1">
                {/* Time label */}
                <div className="text-sm text-gray-600 font-medium py-4 flex items-center">{time}</div>
                
                {/* Staff columns - exactly 2 columns for 青山 and 软软 */}
                {['青山', '软软'].map((staffName) => {
                  // Find appointment for this time slot and this specific staff
                  const appointment = getAppointmentForTimeSlot(time, staffName);
                  const isStart = appointment && isAppointmentStart(appointment, time);
                  
                  return (
                    <div key={`${staffName}-${time}`} className="min-h-[60px] border border-gray-200 rounded-lg">
                      {appointment ? (
                        <div 
                          className={`
                            h-full cursor-pointer hover:shadow-md transition-shadow
                            ${isStart ? 'p-3 rounded-lg border-l-4' : 'border-l-4 bg-opacity-30'}
                            ${appointment.status === 'PENDING' ? 'bg-yellow-50 border-yellow-400 hover:bg-yellow-100' : ''}
                            ${appointment.status === 'CONFIRMED' ? 'bg-blue-50 border-blue-400 hover:bg-blue-100' : ''}
                            ${appointment.status === 'ARRIVED' ? 'bg-green-50 border-green-400 hover:bg-green-100' : ''}
                            ${appointment.status === 'IN_SERVICE' ? 'bg-purple-50 border-purple-400 hover:bg-purple-100' : ''}
                            ${appointment.status === 'COMPLETED' ? 'bg-gray-50 border-gray-400 hover:bg-gray-100' : ''}
                            ${appointment.status === 'CANCELLED' ? 'bg-red-50 border-red-400 hover:bg-red-100' : ''}
                            ${appointment.status === 'OVERDUE' ? 'bg-orange-50 border-orange-400 hover:bg-orange-100' : ''}
                            ${!isStart ? 'opacity-60' : ''}
                          `}
                          onClick={() => window.location.href = `/appointments/${appointment.id}`}
                        >
                          {isStart && (
                            <>
                              <div className="font-medium text-sm text-gray-900">{appointment.customerName} 👤 {appointment.guestCount}人</div>
                              <div className="text-xs text-gray-600 mt-1">{appointment.customerPhone}</div>
                              <div className="text-xs text-gray-600 mt-1">【{appointment.serviceName}】{appointment.duration}分钟</div>
                              <div className={`
                                inline-block px-2 py-1 rounded text-xs mt-1
                                ${appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : ''}
                                ${appointment.status === 'ARRIVED' ? 'bg-green-100 text-green-800' : ''}
                                ${appointment.status === 'IN_SERVICE' ? 'bg-purple-100 text-purple-800' : ''}
                                ${appointment.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                                ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                ${appointment.status === 'OVERDUE' ? 'bg-orange-100 text-orange-800' : ''}
                              `}>
                                {appointmentApi.getStatusText(appointment.status)}
                              </div>
                            </>
                          )}
                          {!isStart && (
                            <div className="h-full flex items-center justify-center">
                              <div className="text-xs text-gray-500 opacity-50">继续</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onCreateAppointment(day.dateString, time)}
                          className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 transition-colors"
                          title={`为${staffName}在${time}添加预约`}
                        >
                          <PlusIcon className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};