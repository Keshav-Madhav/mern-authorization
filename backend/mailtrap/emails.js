import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { mailTrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{email: email}];

  try {
    await mailTrapClient.send({
      from: sender,
      to: recipient,
      subject: "Account Verification",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
      category: "Email Verification"
    })
  } catch (error) {
    console.error('Error sending verification email', error);
    throw new Error('Error sending verification email', error);    
  }
}

export const sendWelcomeEmail = async (email, username) => {
  const recipient = [{email}]

  try {
    await mailTrapClient.send({
      from: sender,
      to: recipient,
      template_uuid: "51365fcf-284a-4b6a-9fc2-12e98c6efd67",
      template_variables: {
        "company_info_name": "Keshav",
        "name": username
      }
    })
  } catch (error) {
    console.error('Error sending welcome email', error);
    throw new Error('Error sending welcome email', error);
  }
}

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{email}];

  try {
    await mailTrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset"
    })
  } catch (error) {
    console.error('Error sending password reset email', error);
    throw new Error('Error sending password reset email', error);
  }
}

export const sentResetSuccessEmail = async (email) => {
  const recipient = [{email}];

  try {
    await mailTrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset"
    })
  } catch (error) {
    console.error('Error sending password reset success email', error);
    throw new Error('Error sending password reset success email', error);
  }
}