import mongoose, { Schema, Document } from "mongoose"

export interface IRestaurant extends Document {
  name: string
  logo: string
  meals: mongoose.Types.ObjectId[]
  locations: mongoose.Types.ObjectId[]
}

const RestaurantSchema: Schema = new Schema({
  name: { type: String, required: true },
  logo: { type: String }, // URL to restaurant's logo
  meals: [{ type: Schema.Types.ObjectId, ref: "Meal" }], // Restaurant has many meals
  locations: [{ type: Schema.Types.ObjectId, ref: "Location" }] // Restaurant has many locations
})

export default mongoose.model<IRestaurant>("Restaurant", RestaurantSchema)
