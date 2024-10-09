import mongoose, { Document, Schema } from "mongoose"

export interface IAppUser extends Document {
  name: string
  email: string
  password: string
  favMeals: mongoose.Types.ObjectId[]
  following: mongoose.Types.ObjectId[]
  userId?: string
}

const AppUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favMeals: [{ type: Schema.Types.ObjectId, ref: "Meal" }], // User's favorite meals
  following: [{ type: Schema.Types.ObjectId, ref: "Blogger" }] // User follows many bloggers
})

export default mongoose.model<IAppUser>("AppUser", AppUserSchema)
