import mongoose, { Document, Model, Schema } from "mongoose"
import { UserRole } from "./user-role.enum"
import { UserType } from "./user-type.eum"
import jwt from "jsonwebtoken"
export interface IRefreshToken extends Document {
  userId: Schema.Types.ObjectId
  token: string
  expiryDate: Date
  userType: UserType
  role: UserRole
}

interface RefreshTokenModel extends Model<IRefreshToken> {
  isExpired(token: IRefreshToken): boolean
}

// Refresh Token Schema
const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "userType" // Dynamic reference to either AppUser or DashboardUser
  },
  token: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  userType: {
    type: String,
    required: true,
    enum: [UserType.AppUser, UserType.DashboardUser]
  },
  role: {
    type: String,
    required: true,
    enum: [UserRole.APP_USER, UserRole.AUDITOR, UserRole.SUPER_ADMIN]
  }
})

// Static method to check if the token is expired
refreshTokenSchema.statics.isExpired = function (token: IRefreshToken) {
  let isExpired = false
  jwt.verify(token.token, process.env.JWT_SECRET as string, err => {
    if (err && err.name === "TokenExpiredError") {
      isExpired = true
    }
  })

  return isExpired
}

export default mongoose.model<IRefreshToken, RefreshTokenModel>(
  "RefreshToken",
  refreshTokenSchema
)
