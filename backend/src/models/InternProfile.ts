import { Schema, model, type InferSchemaType } from "mongoose";

const internProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    school_university: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    required_hours: {
      type: Number,
      required: true,
      min: 1,
    },
    rendered_hours_total: {
      type: Number,
      default: 0,
      min: 0,
    },
    days_worked: {
      type: Number,
      default: 0,
      min: 0,
    },
    actual_end_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type InternProfileDocument = InferSchemaType<typeof internProfileSchema>;

export const InternProfile = model<InternProfileDocument>(
  "InternProfile",
  internProfileSchema,
);

export default InternProfile;
