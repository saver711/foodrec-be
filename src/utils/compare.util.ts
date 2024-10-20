import bcrypt from "bcryptjs"
export const compare = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword)
}
