import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { AppointmentCalendar } from '../components/appointments/AppointmentCalendar';
import { CreateAppointmentDialog } from '../components/appointments/CreateAppointmentDialog';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogDate, setCreateDialogDate] = useState<string | undefined>();
  const [createDialogTime, setCreateDialogTime] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleCreateAppointment = (date?: string, time?: string) => {
    setCreateDialogDate(date);
    setCreateDialogTime(time);
    setShowCreateDialog(true);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1); // Force calendar to refresh
    setShowCreateDialog(false);
  };

  const handleCreateClose = () => {
    setShowCreateDialog(false);
    setCreateDialogDate(undefined);
    setCreateDialogTime(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            返回上一页
          </button>
          <h1 className="text-xl font-semibold text-gray-800">预约日历</h1>
          <div />
        </div>
        <AppointmentCalendar
          key={refreshKey}
          onDateSelect={handleDateSelect}
          onCreateAppointment={handleCreateAppointment}
          selectedDate={selectedDate}
        />

        <CreateAppointmentDialog
          isOpen={showCreateDialog}
          onClose={handleCreateClose}
          onSuccess={handleCreateSuccess}
          defaultDate={createDialogDate}
          defaultTime={createDialogTime}
        />
      </div>
    </div>
  );
};
