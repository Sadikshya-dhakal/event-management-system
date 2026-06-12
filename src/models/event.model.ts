import { model, Schema, SchemaTypes } from 'mongoose';
import { User } from './user.model.js';

const eventSchema = new Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    coverImageURL: {
      type: String,
    },
    location: {
      type: String,
    },
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: User,
    },
  },
  {
    timestamps: true,
  },
);

export const Event = model('Event', eventSchema);
