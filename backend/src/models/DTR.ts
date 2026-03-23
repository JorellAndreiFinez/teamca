import mongoose, { Schema, Document } from "mongoose";

export interface IDTR extends Document {
  user_id: string;
  date: string;
  clock_in_time: Date;
  clock_out_time?: Date;
  hours_rendered: number;
  status: string;
}

const dtrSchema = new Schema<IDTR>(
  {
    user_id: { type: String, required: true },
    date: { type: String, required: true },
    clock_in_time: { type: Date, required: true },
    clock_out_time: { type: Date },
    hours_rendered: { type: Number, default: 0 },
    status: { type: String, default: "Present" },
  },
  { timestamps: true },
);

export default mongoose.model<IDTR>("DTR", dtrSchema);
