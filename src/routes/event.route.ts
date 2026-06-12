import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadBanner,
} from '../controllers/event.controller.js';
import { requireAuth } from '../utils/requireAuth.js';
import { validate } from '../utils/validate.js';
import { createEventSchema, updateEventSchema } from '../utils/event.schema.js';
import { upload } from '../utils/upload.js';

const router = Router();

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected
router.post('/', requireAuth, validate(createEventSchema), createEvent);
router.patch('/:id', requireAuth, validate(updateEventSchema), updateEvent);
router.delete('/:id', requireAuth, deleteEvent);

// Banner upload
router.post('/:id/banner', requireAuth, upload.single('banner'), uploadBanner);

export const eventRouter = router;