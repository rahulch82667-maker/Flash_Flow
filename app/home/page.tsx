"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image"; 
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "@/components/home/Navbar";
import HomeBanner from "@/components/home/HomeBanner";
import CategorySlider from "@/components/home/CategorySlider";
import MenSection from "@/components/home/MenSection";
import WomenSection from "@/components/home/WomenSection";
import BeautySection from "@/components/home/BeautySection";
import Footer from "@/components/Footer";
import CategoriesSection from "@/components/home/CategoriesSection";
import ChatWidget from "@/components/chat/ChatWidget";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Home() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCustomUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    router.replace("/");
  };


  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={user} 
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <main className="pt-20 sm:pt-24">
        <HomeBanner />
        <CategorySlider />
        <CategoriesSection />
        <MenSection user={user} />
        <WomenSection user={user} />
        <BeautySection user={user}/>
        <Footer />
      </main>

      {/* chat components */}
      <ChatWidget />
      <ChatWindow user={user} />

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg">
            <div className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] text-white p-6 text-center relative rounded-t-2xl">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-3 right-4 text-white/80 hover:text-white"
              >
                ✕
              </button>

              {/* Avatar */}
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 backdrop-blur-sm">
                {user?.photoURL ? (
                  <NextImage
                    src={user.photoURL}
                    alt={user?.name || "User"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email)?.charAt(0).toUpperCase()
                )}
              </div>

              <div className="text-xl font-bold mb-1">
                {user?.displayName || user?.name || "No Name"}
              </div>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Role</span>
                <span className="font-semibold text-[#1B2559]">
                  {customUser?.role || "user"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Verified</span>
                <span
                  className={
                    customUser?.isVerified
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  {customUser?.isVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Member since</span>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors mt-4"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}