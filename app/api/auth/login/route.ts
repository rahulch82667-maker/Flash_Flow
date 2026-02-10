import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectDB } from '@/lib/db';
import { otpStore } from '../signup/route'; // Reusing the same Map
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Login Code",
            html: `<h1>Your code is: ${otp}</h1><p>It expires in 10 minutes.</p>`,
        });

        // 4. Store in memory (expires in 10 mins)
        otpStore.set(email, { 
            otp, 
            expires: Date.now() + 600000, 
            data: { email } 
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }
}