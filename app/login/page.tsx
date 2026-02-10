"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1 for Email, 2 for OTP
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Logic to send OTP
    const handleInitialLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Logic to verify OTP and get JWT Cookie
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otp.join('') }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Invalid code");
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // OTP Input Helper
    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-3 mb-6 transition-transform hover:scale-110">
                    <div className="bg-black rounded-full p-2 shadow-lg">
                        <Image src="/Finance_logo.png" alt="Logo" width={36} height={36} className="invert" />
                    </div>
                </div>
                <h1 className="text-[32px] font-bold tracking-tight text-[#0d0c22] mb-3">
                    {step === 1 ? "Welcome back" : "Enter passcode"}
                </h1>
                {step === 2 && <p className="text-[#6e6d7a]">Sent to {email}</p>}
            </div>

            <div className="w-full max-w-[420px]">
                {step === 1 ? (
                    <>
                        <button type="button" className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[#e7e7e9] rounded-full text-[15px] font-bold text-[#0d0c22] hover:border-[#dbdbde] hover:bg-gray-50 transition-all mb-6">
                            <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
                            Continue with Google
                        </button>

                        <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-[#e7e7e9]"></div>
                            <span className="flex-shrink mx-4 text-[#6e6d7a] text-sm">or</span>
                            <div className="flex-grow border-t border-[#e7e7e9]"></div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-[#0d0c22] mb-2 ml-1">Email address</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-4 bg-white border border-[#e7e7e9] rounded-2xl text-[15px] outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                            <button
                                onClick={handleInitialLogin}
                                disabled={loading}
                                className="w-full py-4 bg-[#0d0c22] text-white rounded-full font-bold text-[15px] hover:bg-[#2b2a3d] transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                            >
                                {loading ? "Please wait..." : "Continue"}
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-8">
                        <div className="flex justify-center gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                    className="w-14 h-16 text-center text-2xl font-bold border border-[#e7e7e9] rounded-xl focus:border-black outline-none transition-all"
                                />
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0d0c22] text-white rounded-full font-bold text-[15px] hover:bg-[#2b2a3d] transition-all shadow-lg active:scale-95"
                        >
                            {loading ? "Verifying..." : "Login"}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-black">
                            Use a different email
                        </button>
                    </form>
                )}

                <div className="mt-10 text-center space-y-4">
                    <p className="text-[#6e6d7a] text-sm font-medium">
                        By continuing, you agree to our <span className="text-black underline cursor-pointer">Terms</span> and <span className="text-black underline cursor-pointer">Privacy Policy</span>.
                    </p>
                    <p className="text-[#6e6d7a] text-sm">
                        Don't have an account? <Link href="/signup" className="text-black font-semibold hover:underline decoration-2 underline-offset-4 transition-all">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}