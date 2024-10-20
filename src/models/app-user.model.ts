import mongoose, { Document, Schema } from "mongoose"
import { UserRole } from "./user-role.enum"

export interface IAppUser extends Document {
  name: string
  email?: string // Optional since some users might register with phone only
  phone?: string // Optional since some users might register with Google only
  googleId?: string // Optional for Google registration
  password?: string // Optional for Google users
  otp?: string // For phone-based OTP verification
  isVerified: boolean // Indicates whether the user is verified
  following: mongoose.Types.ObjectId[] // Following bloggers
  role: UserRole.APP_USER
}

const AppUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Email is optional but must be unique if provided
  phone: { type: String, unique: true, sparse: true }, // Phone is optional but must be unique if provided
  googleId: { type: String, unique: true, sparse: true }, // Google ID is optional but must be unique if provided
  password: { type: String }, // Password is optional for Google registration
  otp: { type: String }, // Store OTP for phone verification
  isVerified: { type: Boolean, default: false }, // Default not verified unless verified via OTP or Google
  following: [{ type: Schema.Types.ObjectId, ref: "Blogger" }], // User follows many bloggers
  role: {
    type: String,
    default: UserRole.APP_USER
  }
})

export default mongoose.model<IAppUser>("AppUser", AppUserSchema)
