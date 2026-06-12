import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
      select: false,
    },
    avatarURL: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model('User', userSchema);
