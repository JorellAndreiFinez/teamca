import { Schema, model, type InferSchemaType } from 'mongoose';

const userDepartmentSchema = new Schema(
  {
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    department_role: {
      type: String,
      enum: ['Head', 'Supervisor', 'Intern'],
      required: true,
    },
  },
  {
    _id: false,
  }
);

const userSchema = new Schema(
  {
    first_name: {
      type: String,
      trim: true,
      default: null,
      required(this: { is_active?: boolean }) {
        return this.is_active;
      },
    },
    last_name: {
      type: String,
      trim: true,
      default: null,
      required(this: { is_active?: boolean }) {
        return this.is_active;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password_hash: {
      type: String,
      default: null,
      required(this: { is_active?: boolean }) {
        return this.is_active;
      },
      minlength: 8,
    },
    global_role: {
      type: String,
      enum: ['Superadmin', 'Admin', 'Standard_User'],
      default: null,
      required(this: { is_active?: boolean }) {
        return this.is_active;
      },
    },
    is_active: {
      type: Boolean,
      default: false,
      required: true,
    },
    departments: {
      type: [userDepartmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = model<UserDocument>('User', userSchema);

export default User;