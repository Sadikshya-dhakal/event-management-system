import mongoose from "mongoose";

export function toObjectId(id: string | string[] | undefined, field = "id") {
  if (!id || Array.isArray(id)) {
    throw new Error(`Invalid ${field}`);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${field}`);
  }

  return new mongoose.Types.ObjectId(id);
}