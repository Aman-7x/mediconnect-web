    import { validationResult } from "express-validator";
    import { User } from "../model/user.model.js"
    import dotenv from "dotenv";
    import bcrypt from "bcryptjs";
    import nodemailer from "nodemailer";
    import jwt from "jsonwebtoken";
    dotenv.config();

const baseURL ='http://localhost:3000';


    
        export const fetchProfile = async (request, response) => {
            try {
                let { patientId } = request.user;
                let patient = await User.findById({ _id: patientId });
                patient.profile.imageName = `${baseURL}/patientProfile/${patient.profile.imageName}`;
                return response.status(201).json({ patient });

            } catch (error) {
                console.log(error);
                return response.status(500).json({ error: "Internel server error" });
            }
        }


    export const updateProfile = async (request, response, next) => {
        try {
            const { patientId, role } = request.user;
            let patient = await User.findOne({ _id: patientId, role });
            if (!patient) {
                return response.status(404).json({ error: "Patient not found" });
            }
            patient.name = request.body.name ?? patient.name;
            patient.email = request.body.email ?? patient.email;
            patient.role = request.body.role ?? patient.role;
            patient.profile.imageName = request.file?.filename ?? patient.profile.imageName;
            patient.profile.address = request.body.address ?? patient.profile.address;
            patient.profile.phone = request.body.phone ?? patient.profile.phone;
            patient.profile.bio = request.body.bio ?? patient.profile.bio;
            patient.patientInfo.age = request.body.age ?? patient.patientInfo.age;
            patient.patientInfo.gender = request.body.gender ?? patient.patientInfo.gender;
            await patient.save();
            
            return response.status(200).json({ message: "Profile updated added successfully" });

        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: "Internal Server Error", error });
        }
    }


    export const createPatientProfile = async (request, response, next) => {
        try {
            const { patientId, role } = request.user;

            let patient = await User.findOne({ _id: patientId, role });
            if (!patient) {
                return response.status(404).json({ error: "Patient not found" });
            }
            patient.name = request.body.name ?? patient.name;
            patient.email = request.body.email ?? patient.email;
            patient.role = request.body.role ?? patient.role;
            patient.profile.imageName = request.file?.filename;
            patient.profile.address = request.body.address;
            patient.profile.phone = request.body.phone;
            patient.profile.bio = request.body.bio;
            patient.patientInfo.age = request.body.age;
            patient.patientInfo.gender = request.body.gender;
            await patient.save();
            return response.status(200).json({ message: "Profile updated added successfully" });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: "Internal Server Error", error });
        }
    }


    export const logOutPatient = (request, response, next) => {
        try {
            response.clearCookie("token");
            return response.status(200).json({ message: "Lngout succesfully" })
        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: "Internel server error ", error });
        }
    }

    export const signInPatient = async (request, response, next) => {
        try {
            let { email, password, role } = request.body;
            let patient = await User.findOne({ email, role });
            if (!patient || patient.role !== "patient")
                return response.status(401).json({ error: "Unauthorized user || user not found" });

            if (!patient.patientInfo.isVerified)
                return response.status(401).json({ error: "Please Verify your account || Account is not verified" });

            let isMatch = await bcrypt.compare(password, patient.password); 
            if (!isMatch)
                return response.status(401).json({ error: "Wrong Password || Unauthorized User" });

            const token = generateToken(patient.email, patient._id, patient.role);
            isMatch && response.cookie("token", token,{
                    httpnly:true,
                    secure:false,
                    sameSite:"lax"
            });
            patient.password = undefined;

            isMatch ? response.status(200).json({ message: "Login successful",patient }) : response.status(401).json({ error: "Unauthorized User" })

        } catch (error) {
            console.log(error);
            return response.status(500).json({ error: "Internal Server Error" });
        }
    }



    export const signUpPatient = async (request, response, next) => {
        try {
            //  Validate patient
            const errors = validationResult(request);
            if (!errors.isEmpty())
                return response.status(400).json({ error: "Bad request |Data is Invalid", errorMessages: errors.array() });

            let { name, email, password, role } = request.body;
            let saltkey = await bcrypt.genSalt(10);
            password = bcrypt.hashSync(password, saltkey);
            await User.create({ name, email, password, role });
            await sendEmail(name, email);
            return response.status(201).json({ message: "SignIn Successfull | Please varify your account" });
            
        }
        catch (err) {
            console.log(err);
            return response.status(500).json({ error: "Internel sever Error", err });
        }

    }

    export const  verifyAccount = async (request, response, next) => {
        try {
            let { email } = request.query;
            // console.log("verify : ", email);
            let result = await User.updateOne({ email }, { $set: { "patientInfo.isVerified": true } });
            console.log("MongoDB Update Result:", result);

            if (result.matchedCount === 0)
                return response.status(404).json({ error: "User not found" });
            if (result.modifiedCount === 0)
                return response.status(200).json({ message: "Already verified" });

response.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verified - MediConnect</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f7f6;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .card {
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                    }
                    .icon {
                        font-size: 50px;
                        color: #27ae60;
                        margin-bottom: 15px;
                    }
                    h2 { color: #2c3e50; margin-bottom: 10px; }
                    p { color: #7f8c8d; line-height: 1.5; }
                    .btn {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background-color: #0056b3;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        transition: background 0.3s;
                    }
                    .btn:hover { background-color: #004085; }
                </style>
                <meta http-equiv="refresh" content="5;url=http://localhost:3000/login" />
            </head>
            <body>
                <div class="card">
                    <div class="icon">✓</div>
                    <h2>Email Verified!</h2>
                    <p>Your email address has been successfully verified. You can now log in to your MediConnect account.</p>
                    <a href="http://localhost:5173/signin" class="btn">Go to Login</a>
                    <p style="font-size: 12px; margin-top: 15px; color: #aaa;">
                        Redirecting to login in <span id="timer">5</span> seconds...
                    </p>
                </div>

                <script>
                    let timeLeft = 5;
                    const timerSpan = document.getElementById('timer');
                    setInterval(() => {
                        timeLeft--;
                        if(timeLeft >= 0) timerSpan.textContent = timeLeft;
                    }, 1000);
                </script>
            </body>
            </html>
        `);        }
        catch (err) {
            return response.status(500).json({ error: "Internal Server Error" });
        }

    }

const sendEmail = (name, email) => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Encode email to safely handle special characters like '+' or '.'
        const encodedEmail = encodeURIComponent(email);
        const verificationUrl = `${baseURL}/patient/verification?email=${encodedEmail}`;

        let mailOption = {
            from: `"MediConnect Support" <${process.env.EMAIL}>`,
            to: email,
            subject: "Account Verification - MediConnect",
            // Add plain text fallback (greatly improves email deliverability scores)
            text: `Dear ${name},\n\nWelcome to MediConnect. Please click the following link to verify your email:\n${verificationUrl}\n\nThank you,\nMediConnect Team`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h3>Dear ${name},</h3>
                    <p>Welcome to MediConnect. Please click the button below to verify your account:</p>
                    
                    <!-- Styled Anchor Tag (Safe for all Email Clients) -->
                    <div style="margin: 20px 0;">
                        <a href="${verificationUrl}" 
                           target="_blank" 
                           style="background-color: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Verify Email
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #777;">
                        If the button above does not work, copy and paste this link into your browser:<br/>
                        <a href="${verificationUrl}">${verificationUrl}</a>
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
                    <p style="font-size: 13px; color: #555;">
                        <strong>Thank You,</strong><br/>
                        MediConnect Team
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOption, function (error, info) {
            if (error) {
                console.error("Nodemailer error:", error);
                reject(error);
            } else {
                console.log("Email sent successfully:", info.response);
                resolve(info);
            }
        });
    });
};

    const generateToken = (email, userid, role) => {
        let payload = ({ "patientId": userid, "emailId": email, "role": role });
        return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });
    }


