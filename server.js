const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sgMail = require("@sendgrid/mail");

const app = express();
const PORT = 3000;

// Set SendGrid API key
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1d" }));

// Default route to avoid "Cannot GET /" error
app.get("/", (req, res) => {
    res.send("Welcome to the Attendance API! Use /attendance to submit attendance and /absent to mark absence.");
});

// API endpoint to handle attendance submission
app.post("/attendance", (req, res) => {
    const { name, image } = req.body;
    console.log("Received attendance data:", { name, image });

    // Decode the base64 image and save it as a file
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(__dirname, "uploads", `${name}.png`);

    fs.writeFile(imagePath, base64Data, "base64", (err) => {
        if (err) {
            return res.status(500).json({ message: "Image saving failed" });
        }

        // Configure the email details
        const msg = {
            to: "cyberzypher@gmail.com", // Admin email address
            from: "mailtosidharth.me@gmail.com", // Your verified SendGrid sender email
            subject: "Attendance Record",
            text: `Attendance recorded for ${name}`,
            attachments: [
                {
                    content: base64Data,
                    filename: `${name}.png`,
                    type: "image/png",
                    disposition: "attachment",
                },
            ],
        };

        // Send the email
        sgMail
            .send(msg)
            .then(() => {
                res.status(200).json({ message: `Attendance for ${name} has been recorded.` });

                // Optional: delete the image file after sending
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Image deletion failed:", err);
                });
            })
            .catch((error) => {
                console.error("Email sending failed:", error);
                res.status(500).json({ message: "Email sending failed" });
            });
    });
});

// API endpoint to mark as absent
app.post("/absent", (req, res) => {
    const { name } = req.body;
    console.log("Marking absent for:", name);

    // Check if name is provided
    if (!name) {
        return res.status(400).json({ message: "Name is required." });
    }

    // Configure the email details for absence
    const msg = {
        to: "cyberzypher@gmail.com", // Admin email address
        from: "mailtosidharth.me@gmail.com", // Your verified SendGrid sender email
        subject: "Attendance Absence Record",
        text: `Attendance marked as absent for ${name}`,
    };

    // Send the email
    sgMail
        .send(msg)
        .then(() => {
            res.status(200).json({ message: `Absence for ${name} has been recorded.` });
        })
        .catch((error) => {
            console.error("Email sending failed:", error);
            res.status(500).json({ message: "Email sending failed" });
        });
});

// Start the server
app.listen(PORT, () => {
    console.log("Server is online da parama...");
});
