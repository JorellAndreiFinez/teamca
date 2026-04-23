import { Schema, model, type InferSchemaType } from "mongoose";

const departmentSchema = new Schema(
  {
    department_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 120,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type DepartmentDocument = InferSchemaType<typeof departmentSchema>;

export const Department = model<DepartmentDocument>(
  "Department",
  departmentSchema,
);

export default Department;
