import mongoose, { Schema, Document } from "mongoose"

export interface ILocation extends Document {
  name: string
  googleMapLink: string
  lat: number
  long: number
  address: string
  restaurant: mongoose.Types.ObjectId
}

const LocationSchema: Schema = new Schema({
  name: { type: String, required: true },
  googleMapLink: { type: String },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  address: { type: String, required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" } // Location belongs to a Restaurant
})

export default mongoose.model<ILocation>("Location", LocationSchema)
