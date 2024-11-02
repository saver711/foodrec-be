import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import { deleteFileFromGCS } from "@utils/gcs.util"
import mongoose, { Document, Schema } from "mongoose"
import path from "path"
export interface IRestaurant extends Document {
  name: string
  logo: string
  recommendations: mongoose.Types.ObjectId[]
  locations: mongoose.Types.ObjectId[]
}

const RestaurantSchema: Schema = new Schema({
  name: { type: String, required: true },
  logo: { type: String }, // URL to restaurant's logo
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Restaurant has many recommendations
  locations: [{ type: Schema.Types.ObjectId, ref: "Location" }] // Restaurant has many locations
})

// Post hook to handle cleanup after restaurant deletion
RestaurantSchema.post(
  ["findOneAndDelete", "deleteMany"],
  async function (doc: IRestaurant) {
    try {
      const restaurants: IRestaurant[] = doc
        ? [doc]
        : await this.model.find(this.getFilter())

      // Loop through each restaurant and handle deletions
      for (const restaurant of restaurants) {
        // 1. Delete restaurant's logo from GCS
        if (restaurant.logo) {
          const oldLogoFileName = path.basename(restaurant.logo)
          await deleteFileFromGCS(`restaurants/${oldLogoFileName}`)
        }

        // 2. Delete associated locations
        await Location.deleteMany({ restaurant: restaurant._id })

        // 3. Delete all recommendations associated with the restaurant
        await Recommendation.deleteMany({ restaurant: restaurant._id })
      }
    } catch (err) {
      console.error("Error during restaurant post-delete cleanup:", err)
    }
  }
)

export default mongoose.model<IRestaurant>("Restaurant", RestaurantSchema)
