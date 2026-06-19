import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordOtpEmail(to, otp) {
  await mailTransporter.sendMail({
    from: `"Francesca Gandelli Portfolio" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Codice verifica recupero password",
    text: `Il tuo codice di verifica è: ${otp}\n\nIl codice scade tra 10 minuti.\n\nSe non hai richiesto tu il reset, ignora questa email.`,
  });
}
