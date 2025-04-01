const nodemailer = require('nodemailer');
require("dotenv").config({ path: "../.env" }); // Adjust the path if necessary

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Send Email Function
const sendEmail = async (email, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent,
        });
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

module.exports = { sendEmail };