import { appUserGoogleLogin } from "@controllers/app-user-controllers/auth/app-user-google-login.controller"
import { appUserPhoneLogin } from "@controllers/app-user-controllers/auth/app-user-phone-login.controller"
import { appUserPhoneRegister } from "@controllers/app-user-controllers/auth/app-user-phone-register.controller"
import { verifyOtp } from "@controllers/app-user-controllers/auth/app-user-verify-otp"
import { changeAppUserPassword } from "@controllers/app-user-controllers/auth/change-app-user-password.controller"
import { changeAppUserPhoneNumber } from "@controllers/app-user-controllers/crud/change-app-user-phone-number.controller"
import { deleteAppUser } from "@controllers/app-user-controllers/crud/delete-app-user.controller"
import { getAllAppUsers } from "@controllers/app-user-controllers/crud/get-all-app-users.controller"
import { getAppUserById } from "@controllers/app-user-controllers/crud/get-app-user-by-id"
import { toggleFollowBlogger } from "@controllers/app-user-controllers/crud/toggle-follow-blogger"
import { updateAppUser } from "@controllers/app-user-controllers/crud/update-app-user.controller"
import { addFavorite } from "@controllers/app-user-controllers/favorites/add-favorite.controller"
import { removeFavorite } from "@controllers/app-user-controllers/favorites/remove-favorite.controller"
import { getFavorites } from "@controllers/app-user-controllers/favorites/get-favorites.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/s3.util"
import express, { NextFunction, Request, Response } from "express"
const router = express.Router()

// Create a new app user (Phone)
router.post("/register/phone", (req: Request, res: Response) => {
  appUserPhoneRegister(req, res)
})
// Login app user (google)
router.post("/login/google", (req: Request, res: Response) => {
  appUserGoogleLogin(req, res)
})
// Login app user (phone)
router.post("/login/phone", (req: Request, res: Response) => {
  appUserPhoneLogin(req, res)
})
// OTP verification route (can be implemented later)
router.post("/verify-otp", (req: Request, res: Response) => {
  verifyOtp(req, res)
})

// ----------------------------------------------------------------------
// Get all app users
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  getAllAppUsers
)
// Get a single app user
router.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response) => {
    getAppUserById(req, res)
  }
)
// Change password
router.put(
  "/change-password",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    changeAppUserPassword(req, res)
  }
)

// App Users and Super Admin can edit App User info
router.put(
  "/update",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER, UserRole.SUPER_ADMIN])(req, res, next)
  },
  upload.single("image"),
  (req: Request, res: Response) => {
    updateAppUser(req, res)
  }
)

// App Users and Super Admin can change phone number for App User
router.put(
  "/change-phone",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER, UserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response) => {
    changeAppUserPhoneNumber(req, res)
  }
)

// Delete app user (SUPER_ADMIN only)
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteAppUser(req, res)
  }
)
router.post(
  "/bloggers/:bloggerId/follow",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    toggleFollowBlogger(req, res)
  }
)

// Favorites routes
/**
 * @swagger
 * /app-users/{userId}/favorites/{recommendationId}:
 *   post:
 *     summary: Add a recommendation to user's favorites
 *     description: Adds a recommendation to the authenticated user's favorites list
 *     tags:
 *       - APP_USERS
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recommendation ID to add to favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation added to favorites successfully
 *       400:
 *         description: Recommendation already in favorites
 *       403:
 *         description: Forbidden - can only modify own favorites
 *       404:
 *         description: User or recommendation not found
 */
router.post(
  "/:userId/favorites/:recommendationId",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    addFavorite(req, res, next)
  }
)

/**
 * @swagger
 * /app-users/{userId}/favorites/{recommendationId}:
 *   delete:
 *     summary: Remove a recommendation from user's favorites
 *     description: Removes a recommendation from the authenticated user's favorites list
 *     tags:
 *       - APP_USERS
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recommendation ID to remove from favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation removed from favorites successfully
 *       400:
 *         description: Recommendation not in favorites
 *       403:
 *         description: Forbidden - can only modify own favorites
 *       404:
 *         description: User or recommendation not found
 */
router.delete(
  "/:userId/favorites/:recommendationId",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    removeFavorite(req, res, next)
  }
)

/**
 * @swagger
 * /app-users/{userId}/favorites:
 *   get:
 *     summary: Get user's favorite recommendations
 *     description: Retrieves all favorite recommendations for the authenticated user with pagination and filtering
 *     tags:
 *       - APP_USERS
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         description: Comma-separated fields to populate (blogger,restaurant,categories,locations)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/definitions/Recommendation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Forbidden - can only view own favorites
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId/favorites",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    getFavorites(req, res, next)
  }
)

export default router
