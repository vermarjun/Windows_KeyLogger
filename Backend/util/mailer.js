import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from '../config.js';

const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.pass,
  },
});

const sendMail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: EMAIL_CONFIG.user,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
};

export default sendMail; 