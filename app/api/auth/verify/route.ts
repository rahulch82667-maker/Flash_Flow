import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { connectDB } from '@/lib/db';
import { otpStore } from '../signup/route'; 
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        // 1. Validate OTP from memory
        const record = otpStore.get(email);
        if (!record || record.otp !== otp || Date.now() > record.expires) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // 2. Connect to Database
        await connectDB();

        // 3. Create User in DB
        // We use findOneAndUpdate with 'upsert' to prevent duplicate errors 
        // if a user retries the verification.
        const user = await User.findOneAndUpdate(
            { email: email },
            { 
                email: email,
                dob: record.data.dob,
                age: record.data.age,
                gender: record.data.gender,
                city: record.data.city,
                pincode: record.data.pincode
            },
            { upsert: true, new: true }
        );

        // 4. Create JWT Token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
        const token = await new SignJWT({ 
            userId: user._id.toString(),
            email: user.email 
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secret);

        // 5. Cleanup memory
        otpStore.delete(email);

        // 6. Set Cookie Response
        const response = NextResponse.json({ 
            success: true, 
            message: "Account verified and saved!" 
        }, { status: 200 });

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error("❌ Verification Error:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}