import mongoose, { Document, Schema } from "mongoose"
import { UserRole } from "./user-role.enum"

export interface IAppUser extends Document {
  name: string
  email: string
  password: string
  favMeals: mongoose.Types.ObjectId[]
  following: mongoose.Types.ObjectId[]
  userId?: string
  role: UserRole.APP_USER
}

const AppUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favMeals: [{ type: Schema.Types.ObjectId, ref: "Meal" }], // User's favorite meals
  following: [{ type: Schema.Types.ObjectId, ref: "Blogger" }], // User follows many bloggers
  role: {
    type: String,
    default: UserRole.APP_USER
  }
})

export default mongoose.model<IAppUser>("AppUser", AppUserSchema)
