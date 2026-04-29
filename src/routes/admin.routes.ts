// ============================================================
// Admin Routes — /api/v1/admin
// ============================================================
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { adminOnly } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { updateRoleSchema, userQuerySchema } from '../validators/user.validator';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate as any, adminOnly as any);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', validate(userQuerySchema, 'query'), adminController.getUsers);
router.patch('/users/:userId/role', validate(updateRoleSchema), adminController.updateUserRole);
router.post('/drivers/:driverId/suspend', adminController.suspendDriver);
router.post('/drivers/:driverId/unsuspend', adminController.unsuspendDriver);
router.get('/bookings', adminController.getAllBookings);
router.get('/tickets', adminController.getTickets);

export default router;
