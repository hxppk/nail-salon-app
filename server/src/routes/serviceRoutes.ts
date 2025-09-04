import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  getServiceStats
} from '../controllers/serviceController';

const router = express.Router();

// Service CRUD routes
router.get('/', getServices);
router.get('/stats', getServiceStats);
router.get('/categories', getServiceCategories);
router.get('/:id', getServiceById);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;