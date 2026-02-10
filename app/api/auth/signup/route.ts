import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Temporary store for OTPs and user data before DB persistence.
 * In a production environment, it is highly recommended to use Redis 
 * or a temporary MongoDB collection for better scalability.
 */
export const otpStore = new Map<string, { otp: string; expires: number; data: any }>();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, dob, gender, city, pincode } = body;

        // 1. Basic Validation
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Calculate Age (to ensure data is ready for the User Model later)
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }

        // 4. Configure Nodemailer Transporter
        // Uses credentials from your .env.local file
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
            },
        });

        // 5. Send the OTP to the user-provided email
        await transporter.sendMail({
            from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
            to: email, // Dynamic recipient from signup form
            subject: "Verify your Finance Tracker Account",
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0d0c22; text-align: center;">Verification Code</h2>
                    <p style="font-size: 16px; color: #6e6d7a; text-align: center;">
                        Use the following code to verify your account and complete your signup.
                    </p>
                    <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d0c22;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #9e9ea7; text-align: center;">
                        This code will expire in 10 minutes. If you did not request this, please ignore this email.
                    </p>
                </div>
            `,
        });

        // 6. Store data temporarily
        // We store the full body + calculated age so we can save it to DB in the verify route
        otpStore.set(email, { 
            otp, 
            expires: Date.now() + 600000, // 10 minutes
            data: { ...body, age: calculatedAge } 
        });

        console.log(`✅ OTP sent to ${email}: ${otp}`);

        return NextResponse.json({ 
            success: true, 
            message: "OTP sent successfully" 
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ Signup Error:", error);
        return NextResponse.json({ 
            error: "Failed to process signup. Please check your email settings." 
        }, { status: 500 });
    }
}