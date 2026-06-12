import { model, Schema, SchemaTypes } from 'mongoose';

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    bannerPath: {
      type: String,
    },
    organizerId: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Event = model('Event', eventSchema);