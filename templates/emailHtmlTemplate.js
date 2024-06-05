export const generateOtpEmailHtml = (otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
    <h2 style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #333;">Your OTP Code</h2>
    <p>Dear User,</p>
    <p>We received a request to reset your password. Please use the following OTP (One Time Password) to proceed:</p>
    <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; color: #1a73e8;">
      ${otp}
    </div>
    <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    <p>Thank you,<br/>MokBhaiMJ Team</p>
    <hr style="border: none; border-top: 1px solid #ddd;"/>
    <p style="font-size: 12px; color: #888;">If you have any questions, contact our support team at support@example.com.</p>
  </div>
`;
