import { Router } from 'express';
import {
  createMember,
  getMembers,
  getMemberById,
  rechargeBalance,
  getMemberTransactions,
  updateMember,
  consumeBalance,
  getMemberStats
} from '../controllers/memberController';

const router = Router();

// Get all members with filters and pagination
router.get('/', getMembers);

// Create new member
router.post('/', createMember);

// Get member by ID
router.get('/:id', getMemberById);

// Get member statistics
router.get('/:id/stats', getMemberStats);

// Get member transactions
router.get('/:id/transactions', getMemberTransactions);

// Update member information
router.put('/:id', updateMember);

// Recharge member balance
router.post('/:id/recharge', rechargeBalance);

// Consume member balance
router.post('/:id/consume', consumeBalance);

export default router;