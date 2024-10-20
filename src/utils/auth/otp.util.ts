export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString() // Generate 6-digit OTP
}

export const sendOtp = async (phone: string, otp: string): Promise<void> => {
  console.log(`Sending OTP ${otp} to phone ${phone}`)

  // Implement logic to send OTP via SMS using a third-party service like Twilio
}
