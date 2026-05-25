import { OtpEmail } from "./otp-email"

type VerificationOtpEmailProps = {
  otp: string
}

export const verificationOtpEmailSubject = "Verify your Qaza email"
export const verificationOtpEmailPreview =
  "Your Qaza verification code expires in 15 minutes."

export default function VerificationOtpEmail({ otp }: VerificationOtpEmailProps) {
  return (
    <OtpEmail
      preview={verificationOtpEmailPreview}
      heading="Verify your email"
      body="Use this code to finish setting up your Qaza account."
      otp={otp}
      footerNote="If you did not create a Qaza account, you can ignore this email."
    />
  )
}
