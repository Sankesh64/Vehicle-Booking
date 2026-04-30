// ============================================================
// Driver Routes — /api/v1/drivers
// ============================================================
import { Router } from 'express';
import { driverController } from '../controllers/driver.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { adminOnly } from '../middlewares/authorize';
import { driverOnboardSchema, updateLocationSchema, toggleAvailabilitySchema, kycReviewSchema } from '../validators/driver.validator';

const router = Router();

// Protected
router.post('/onboard', authenticate as any, validate(driverOnboardSchema), driverController.onboard);
router.put('/me/location', authenticate as any, validate(updateLocationSchema), driverController.updateLocation);
router.put('/me/availability', authenticate as any, validate(toggleAvailabilitySchema), driverController.toggleAvailability);
router.get('/me/profile', authenticate as any, driverController.getProfile);

// KYC
router.post('/kyc/initiate', driverController.initiateKYC);
router.get('/kyc/pending', authenticate as any, adminOnly as any, driverController.getPendingKYC);
router.patch('/kyc/:sessionId/review', authenticate as any, adminOnly as any, validate(kycReviewSchema), driverController.reviewKYC);

export default router;
