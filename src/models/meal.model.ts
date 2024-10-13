import mongoose, { Schema, Document } from "mongoose"

export interface IMeal extends Document {
  name: string
  description: string
  images: string[]
  categories: mongoose.Types.ObjectId[]
  likedBy: mongoose.Types.ObjectId[]
  recommendations: mongoose.Types.ObjectId[]
  restaurant: mongoose.Types.ObjectId // Linked restaurant
}

const MealSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // List of image URLs
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }], // Many-to-many relation with categories
  likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // Many-to-many relation with users
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Many recommendations
  restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" }
})

export default mongoose.model<IMeal>("Meal", MealSchema)
