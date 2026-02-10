"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); 
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // OTP Logic
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [formData, setFormData] = useState({
        email: "", dob: "", age: 0, gender: "", state: "", city: "", pincode: ""
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (dateValue) {
            const birthDate = new Date(dateValue);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setFormData({ ...formData, dob: dateValue, age: calculatedAge >= 0 ? calculatedAge : 0 });
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStep(2); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const otpCode = otp.join('');
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp: otpCode }),
            });
            if (!res.ok) throw new Error("Verification failed. Please check the code.");
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[420px]">
                {step === 1 ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-[32px] font-bold tracking-tight text-[#0d0c22] mb-3">Sign up</h1>
                            <p className="text-[#6e6d7a] mb-8">Create your account to start tracking your finances.</p>
                            
                            {/* GOOGLE BUTTON ADDED HERE */}
                            <button 
                                type="button"
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[#e7e7e9] rounded-full font-bold text-[#0d0c22] hover:bg-gray-50 transition-all mb-6"
                            >
                                <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-[1px] bg-[#e7e7e9] flex-1"></div>
                                <span className="text-[#6e6d7a] text-sm">or</span>
                                <div className="h-[1px] bg-[#e7e7e9] flex-1"></div>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleInitialSubmit}>
                            <div>
                                <label className="block text-sm font-bold text-[#0d0c22] mb-2">Email Address</label>
                                <input type="email" required placeholder="Enter email" className="w-full px-4 py-3.5 bg-white border border-[#e7e7e9] rounded-2xl outline-none focus:border-black transition-all" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" required onChange={handleDateChange} className="w-full px-4 py-3 border border-[#e7e7e9] rounded-2xl outline-none focus:border-black" />
                                <select required className="w-full px-4 py-3 border border-[#e7e7e9] rounded-2xl outline-none focus:border-black appearance-none" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="">Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="City" className="w-full px-4 py-3 border border-[#e7e7e9] rounded-2xl outline-none focus:border-black" onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                <input type="text" placeholder="Pincode" className="w-full px-4 py-3 border border-[#e7e7e9] rounded-2xl outline-none focus:border-black" onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
                            </div>
                            
                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                            <button type="submit" disabled={loading} className="w-full py-4 bg-[#0d0c22] text-white rounded-full font-bold shadow-lg active:scale-95 disabled:bg-gray-400">
                                {loading ? "Please wait..." : "Continue"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center animate-in fade-in duration-500">
                        <Image src="/Finance_logo.png" alt="Logo" width={48} height={48} className="mx-auto mb-8" />
                        <h1 className="text-[32px] font-bold text-[#0d0c22] mb-4">Create your account</h1>
                        <p className="text-[#6e6d7a] mb-8">
                            We've sent you a passcode.<br />
                            Please check your inbox at <span className="text-black font-semibold">{formData.email.replace(/(.{2})(.*)(?=@)/, "$1***")}</span>
                        </p>

                        <form onSubmit={handleVerifyOtp}>
                            <div className="flex justify-center gap-2 mb-8">
                                {otp.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength={1}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        value={data}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className="w-14 h-16 text-center text-2xl font-bold border border-[#e7e7e9] rounded-xl focus:border-black outline-none transition-all"
                                    />
                                ))}
                            </div>
                            
                            {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}

                            <button type="button" className="text-[#6e6d7a] text-sm hover:text-black mb-8 block mx-auto underline">
                                Resend code
                            </button>

                            <button type="submit" disabled={loading} className="w-full py-4 bg-[#0d0c22] text-white rounded-full font-bold shadow-lg">
                                {loading ? "Verifying..." : "Verify & Sign Up"}
                            </button>
                        </form>
                    </div>
                )}
                
                <p className="mt-8 text-center text-sm text-[#6e6d7a]">
                    Already have an account? <Link href="/login" className="text-black font-semibold underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}