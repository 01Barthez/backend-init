import otpGenerator from 'otp-generator';

const generate_otp = (): string | undefined => {
  try {
    const otpGenerate: string = otpGenerator.generate(
      6, // Number of Caracters
      {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      },
    );

    // Return a string of number who will be our otp Number
    return otpGenerate;
  } catch (error) {
    throw new Error(`Failed to generate OTP: ${error}`);
  }
};

export default generate_otp;
