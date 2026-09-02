import otpGenerator from 'otp-generator';

/** Generate a 6-digit numeric OTP. */
const generateOtp = (): string => {
  try {
    return otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  } catch (error) {
    throw new Error(`Failed to generate OTP: ${error}`);
  }
};

export default generateOtp;
