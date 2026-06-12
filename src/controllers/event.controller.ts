import type { Response } from "express";
import type { AuthRequest } from "../utils/requireAuth.js";
import { Event } from "../models/event.model.js";
import { cacheGet, cacheSet, cacheDelete } from "../services/cache.service.js";
import { enqueuePublishJob } from "../services/event.queue.js";
import { toObjectId } from "../utils/toObjectId.js";

const CACHE_KEY = "events:published";

/* ---------------- CREATE EVENT ---------------- */
export async function createEvent(req: AuthRequest, res: Response) {
  const event = await Event.create({
    ...req.body,
    organizerId: req.userId,
  });

  await cacheDelete(CACHE_KEY);

  return res.status(201).json({
    message: "Event created",
    data: event,
  });
}

/* ---------------- GET ALL PUBLISHED EVENTS ---------------- */
export async function getEvents(_req: AuthRequest, res: Response) {
  const cached = await cacheGet(CACHE_KEY);

  if (cached) {
    console.log("[CACHE HIT] events:published");

    return res.json({
      message: "All published events",
      data: JSON.parse(cached),
    });
  }

  console.log("[CACHE MISS] events:published");

  const events = await Event.find({ status: "published" }).sort({ date: 1 });

  await cacheSet(CACHE_KEY, events);

  return res.json({
    message: "All published events",
    data: events,
  });
}

/* ---------------- GET EVENT BY ID ---------------- */
export async function getEventById(req: AuthRequest, res: Response) {
  const eventId = toObjectId(req.params.id, "eventId");

  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json({
    message: "Event found",
    data: event,
  });
}

/* ---------------- UPDATE EVENT ---------------- */
export async function updateEvent(req: AuthRequest, res: Response) {
  const eventId = toObjectId(req.params.id, "eventId");
  const userId = toObjectId(req.userId, "userId");

  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      organizerId: userId,
    },
    req.body,
    { new: true }
  );

  if (!event) {
    return res.status(404).json({
      message: "Event not found or not yours",
    });
  }

  await cacheDelete(CACHE_KEY);

  // Only enqueue job when publishing
  if (req.body.status === "published") {
    await enqueuePublishJob(event._id.toString(), event.title);
  }

  return res.json({
    message: "Event updated",
    data: event,
  });
}

/* ---------------- DELETE EVENT ---------------- */
export async function deleteEvent(req: AuthRequest, res: Response) {
  const eventId = toObjectId(req.params.id, "eventId");
  const userId = toObjectId(req.userId, "userId");

  const event = await Event.findOneAndDelete({
    _id: eventId,
    organizerId: userId,
  });

  if (!event) {
    return res.status(404).json({
      message: "Event not found or not yours",
    });
  }

  await cacheDelete(CACHE_KEY);

  return res.json({
    message: "Event deleted",
  });
}

/* ---------------- UPLOAD BANNER ---------------- */
export async function uploadBanner(req: AuthRequest, res: Response) {
  const eventId = toObjectId(req.params.id, "eventId");
  const userId = toObjectId(req.userId, "userId");

  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      organizerId: userId,
    },
    { bannerPath: req.file.path },
    { new: true }
  );

  if (!event) {
    return res.status(404).json({
      message: "Event not found or not yours",
    });
  }

  return res.json({
    message: "Banner uploaded",
    bannerPath: event.bannerPath,
  });
}