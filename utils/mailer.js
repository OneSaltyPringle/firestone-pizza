const nodemailer = require('nodemailer');

function getTransporter() {
 console.log("Creating transporter with:", process.env.EMAIL_USER, process.env.EMAIL_PASS);

  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

module.exports = getTransporter;
