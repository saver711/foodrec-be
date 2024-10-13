import mongoose, { Schema, Document } from "mongoose"

export interface ILocation extends Document {
  name: string
  address: string
  coordinates: { type: string; coordinates: [number, number] } // Geospatial field with [longitude, latitude]
  restaurant: mongoose.Types.ObjectId // The restaurant to which this location belongs
}

const LocationSchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, default: "Point" }, // Specify that this field stores geospatial data
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true }
})

// Create a 2dsphere index on the 'coordinates' field for geospatial queries
LocationSchema.index({ coordinates: "2dsphere" })

export default mongoose.model<ILocation>("Location", LocationSchema)
