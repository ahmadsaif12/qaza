import { OtpEmail } from "./otp-email"

type PasswordResetOtpEmailProps = {
  otp: string
}

export const passwordResetOtpEmailSubject = "Reset your Qaza password"
export const passwordResetOtpEmailPreview =
  "Your Qaza password reset code expires in 15 minutes."

export default function PasswordResetOtpEmail({ otp }: PasswordResetOtpEmailProps) {
  return (
    <OtpEmail
      preview={passwordResetOtpEmailPreview}
      heading="Reset your password"
      body="Use this code to choose a new password for your Qaza account."
      otp={otp}
      footerNote="If you did not request this, you can ignore this email."
    />
  )
}
