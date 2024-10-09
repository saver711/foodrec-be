import mongoose, { Document, Schema } from "mongoose"
import { DashboardUserRole } from "./user-role.enum"

export interface IDashboardUser extends Document {
  name: string
  email: string
  password: string
  role: DashboardUserRole
  userId?: string // Comes from the access token
}

const DashboardUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [DashboardUserRole.SUPER_ADMIN, DashboardUserRole.AUDITOR],
    default: DashboardUserRole.AUDITOR
  }
})

export default mongoose.model<IDashboardUser>(
  "DashboardUser ",
  DashboardUserSchema
)
