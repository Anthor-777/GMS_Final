import { Router } from 'express';
import {
  getGymAnalytics,
  getMemberAnalytics,
  getNewCustomerAnalytics,
  getVisitLevels
} from '../controllers/analytics.js';
import { idParam } from '../middleware/validate.js';

const router = Router();

router.get('/gym', getGymAnalytics);
router.get('/levels', getVisitLevels);
router.get('/member/:id', idParam, getMemberAnalytics);
router.get('/new-customer', getNewCustomerAnalytics);

export default router;
