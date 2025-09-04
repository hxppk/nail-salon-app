import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats,
  getAvailableStaff,
} from '../controllers/appointmentController';

const router = Router();

// Get all appointments with filters and pagination
router.get('/', getAppointments);

// Get appointment statistics
router.get('/stats', getAppointmentStats);

// Get available staff
router.get('/staff', getAvailableStaff);

// Create new appointment
router.post('/', createAppointment);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Update appointment
router.put('/:id', updateAppointment);

// Update appointment status
router.patch('/:id/status', updateAppointmentStatus);

// Delete/cancel appointment
router.delete('/:id', deleteAppointment);

export default router;