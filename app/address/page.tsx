"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronLeft,
  Plus,
  X,
  Mail,
  LogOut,
  Calendar,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchAddresses,
  setSelectedAddress,
  clearError,
  clearSuccess,
} from "@/lib/redux/features/address/addressSlice";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/Footer";
import AddressStats from "@/components/address/AddressStats";
import AddressList from "@/components/address/AddressList";
import AddressForm from "@/components/address/AddressForm";
import DeleteAddressModal from "@/components/address/DeleteAddressModal";

export default function AddressPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [customUser, setCustomUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    addressId: string | null;
  }>({
    show: false,
    addressId: null,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { addresses, loading, success, error } = useAppSelector(
    (state) => state.address,
  );

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

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (customUser || firebaseUser) {
      dispatch(fetchAddresses());
    }
  }, [dispatch, customUser, firebaseUser]);

  useEffect(() => {
    if (success) {
      showToast(
        editingAddress
          ? "Address updated successfully"
          : "Address added successfully",
        "success",
      );
      setShowForm(false);
      setEditingAddress(null);
      dispatch(clearSuccess());
    }
  }, [success, dispatch, editingAddress]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const user = customUser || firebaseUser;

  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });
    router.replace("/");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDelete = (addressId: string) => {
    setDeleteModal({ show: true, addressId });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ show: false, addressId: null });
  };


  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[120px] pointer-events-none" />

      <Navbar
        user={user}
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />

      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link
              href="/home"
              className="hover:text-[#5D5FEF] transition-colors"
            >
              Home
            </Link>
            <ChevronLeft size={14} />
            <span className="text-gray-900 font-medium">Manage Addresses</span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-200">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#5D5FEF] font-black text-xs tracking-widest uppercase">
                  Address Management
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B2559] tracking-tight">
                My Addresses
              </h2>
              <p className="text-[#A3AED0] font-semibold text-xs sm:text-sm mt-1">
                Manage your saved addresses for delivery
              </p>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#5D5FEF] text-white rounded-xl font-black text-sm sm:text-base hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                Add New Address
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <AddressStats addresses={addresses} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Address List */}
            <div className="lg:col-span-2">
              
                <AddressList
                  addresses={addresses}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showForm={showForm}
                  onSuccess={() => {
                    showToast("Address Set Default successfully", "success");
                  }}
                />
             
            </div>

            {/* Address Form */}
            <div className="lg:col-span-1">
              <AddressForm
                user={user}
                editingAddress={editingAddress}
                onClose={handleCloseForm}
                isVisible={showForm}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Delete Address Modal */}
      <DeleteAddressModal
        isOpen={deleteModal.show}
        addressId={deleteModal.addressId}
        onClose={handleCloseDeleteModal}
        onSuccess={() => {
          showToast("Address deleted successfully", "success");
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
          >
            <div
              className={`px-4 py-3 rounded-lg shadow-xl font-medium text-sm flex items-center gap-2 ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowProfile(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="bg-gradient-to-r from-[#5D5FEF] to-[#868CFF] p-6 text-center relative">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 backdrop-blur-sm border-2 border-white/30">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user?.name || "User"}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  (user?.displayName || user?.name || user?.email)
                    ?.charAt(0)
                    .toUpperCase()
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {user?.displayName || user?.name || "User"}
              </h3>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Role</span>
                </div>
                <span className="text-sm font-semibold text-[#1B2559]">
                  {customUser?.role || "user"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Verified</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    customUser?.isVerified ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {customUser?.isVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#5D5FEF]" />
                  <span className="text-sm text-gray-600">Member since</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
