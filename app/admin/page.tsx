"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DailyUsersChart from "@/components/admin/DailyUsersChart";
import WishlistsTab from "@/components/admin/WishlistsTab";
import ReviewsTab from "@/components/admin/ReviewsTab";
import AddressesTab from "@/components/admin/AddressesTab";
import CartsTab from "@/components/admin/CartsTab";
import OrdersTab from "@/components/admin/OrdersTab";
import PaymentsTab from "@/components/admin/PaymentsTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Package,
  X,
  ArrowUpRight,
  MessageSquare,
  Eye,
  Heart,
  Pencil,
  CheckCircle2,
  MapPin,
  Calendar,
  Mail,
  ShieldCheck,
  ShoppingCart,
  UserIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  UserX,
  Clock,
  Package2,
  CreditCard,
  Tag,
} from "lucide-react";
import ProductsTab from "@/components/admin/ProductsTab";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchCurrentUser,
  logoutUser,
} from "@/lib/redux/features/auth/authSlice";
import { fetchDashboard } from "@/lib/redux/features/dashboard/dashboardSlice";
import {
  fetchUsers,
  updateUser,
  deleteUser,
  clearUsersError,
} from "@/lib/redux/features/users/usersSlice";
import { div } from "framer-motion/client";

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { users, loading: usersLoading } = useAppSelector(
    (state) => state.users,
  );
  const { data: dashboard } = useAppSelector((state) => state.dashboard);

  const [showProfile, setShowProfile] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    role: "user",
    isVerified: true,
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchDashboard());
    dispatch(fetchUsers());
  }, [dispatch]);

  const directoryUsers = users.filter((u: any) => u.role === "user");

  const totalPages = Math.max(
    1,
    Math.ceil(directoryUsers.length / itemsPerPage),
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = directoryUsers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.replace("/");
  };

  async function handleSaveEdit(updated: {
    id: string;
    name: string;
    role: string;
    isVerified: boolean;
  }) {
    setSavingEdit(true);
    const result = await dispatch(
      updateUser({
        id: updated.id,
        data: {
          name: updated.name,
          role: updated.role,
          isVerified: updated.isVerified,
        },
      }),
    );

    if (updateUser.fulfilled.match(result)) {
      setEditModal(false);
      showToast("User updated successfully", "success");
    } else {
      showToast("Update failed", "error");
    }
    setSavingEdit(false);
  }

  async function handleDeleteUser(id: string) {
    setDeleting(true);
    const result = await dispatch(deleteUser(id));

    if (deleteUser.fulfilled.match(result)) {
      setDeleteModal(false);
      setUserToDelete(null);
      showToast("User deleted successfully", "success");
    } else {
      showToast("Failed to delete user", "error");
    }
    setDeleting(false);
  }

  function openDeleteModal(id: string) {
    setUserToDelete(id);
    setDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteModal(false);
    setUserToDelete(null);
  }

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="animate-spin w-10 h-10 border-4 border-[#5D5FEF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#1B2559] font-sans selection:bg-[#5D5FEF]/30">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5D5FEF]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFB800]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 inset-x-0 h-16 sm:h-20 bg-white/70 backdrop-blur-xl z-[60] px-4 sm:px-6 md:px-8 flex items-center justify-between border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer">
          <div className="transform transition-all duration-500 ease-in-out group-hover:scale-125 group-hover:rotate-[15deg] group-hover:drop-shadow-[0_10px_10px_rgba(93,95,239,0.3)]">
            <Image
              src="/Flow_logo_.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain sm:w-12 sm:h-12"
            />
          </div>
          <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tighter text-[#1B2559] uppercase transition-colors duration-300 group-hover:text-[#5D5FEF]">
            Flash{" "}
            <span className="text-[#5D5FEF] group-hover:text-[#1B2559]">
              Flow
            </span>
          </h1>
        </div>

        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 sm:gap-3 p-1.5 pl-3 sm:pl-4 pr-1.5 sm:pr-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="text-right hidden lg:block">
            <p className="text-xs font-bold text-[#1B2559] leading-tight">
              {user.name}
            </p>
            <p className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-tighter">
              {user.role}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#5D5FEF] to-[#868CFF] text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm shadow-indigo-200 shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </button>
      </nav>

      <div className="flex pt-16 sm:pt-20 h-screen overflow-hidden">
        {/* --- SIDEBAR --- */}
{/* --- SIDEBAR --- */}
<aside className="hidden lg:flex h-screen sticky top-0 w-64 xl:w-72 bg-transparent flex-col p-4 xl:p-6 z-50">
  <div className="flex flex-col h-full">
    {/* Main Menu Header */}
    <div className="flex-none">
      <p className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-[0.2em] mb-6 px-4">
        Main Menu
      </p>
    </div>

    {/* Scrollable Menu Items - Takes remaining space but leaves room for logout */}
    <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar mb-4">
      <div className="space-y-3">
        <SidebarLink
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <SidebarLink
          icon={<Users size={20} />}
          label="User Lists"
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        />
        <SidebarLink
          icon={<Package size={20} />}
          label="Products"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        />
        <SidebarLink
          icon={<Heart size={20} />}
          label="Wishlists"
          active={activeTab === "wishlists"}
          onClick={() => setActiveTab("wishlists")}
        />
        <SidebarLink
          icon={<MessageSquare size={20} />}
          label="Reviews"
          active={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
        />
        <SidebarLink
          icon={<MapPin size={20} />}
          label="Addresses"
          active={activeTab === "addresses"}
          onClick={() => setActiveTab("addresses")}
        />
        <SidebarLink
          icon={<ShoppingCart size={20} />}
          label="Carts"
          active={activeTab === "carts"}
          onClick={() => setActiveTab("carts")}
        />
        <SidebarLink
          icon={<Package size={20} />}
          label="Orders"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
        />
        <SidebarLink
          icon={<Tag size={20} />}
          label="Promo Codes"
          active={activeTab === "promos"}
          onClick={() => setActiveTab("promos")}
        />
        <SidebarLink
          icon={<CreditCard size={20} />}
          label="Payments"
          active={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
        />
      </div>
    </div>

    {/* Logout Button - Fixed at bottom */}
    <div className="flex-none border-t border-gray-200 pt-4">
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[#8A94A6] hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm border border-transparent hover:border-red-100"
      >
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  </div>
</aside>
        {/* --- MOBILE BOTTOM NAV --- */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50 px-2 sm:px-4 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around max-w-md mx-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "dashboard"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <LayoutDashboard size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "users"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <Users size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">Users</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "products"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Products
              </span>
            </button>
            <button
              onClick={() => setActiveTab("wishlists")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "wishlists"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <Heart size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Wishlists
              </span>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "reviews"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <MessageSquare size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Reviews
              </span>
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "addresses"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <MapPin size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Addresses
              </span>
            </button>
            <button
              onClick={() => setActiveTab("carts")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "carts"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <ShoppingCart size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">Carts</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "orders"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Orders
              </span>
            </button>
            <button
              onClick={() => setActiveTab("promos")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "promos"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <Tag size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Promos
              </span>
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === "payments"
                  ? "text-[#5D5FEF] bg-[#5D5FEF]/10"
                  : "text-[#A3AED0]"
              }`}
            >
              <CreditCard size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Payments
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-red-500"
            >
              <LogOut size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="text-[8px] sm:text-[10px] font-bold">
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-12 pb-24 lg:pb-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" ? (
              <div className="animate-in fade-in duration-500 space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#5D5FEF] to-[#868CFF] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[#5D5FEF] font-black text-[10px] sm:text-xs tracking-widest uppercase block">
                          Real-Time Analytics
                        </span>
                        <span className="text-[#A3AED0] font-bold text-[9px] sm:text-[10px] tracking-wide uppercase">
                          System Overview
                        </span>
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-[#1B2559] tracking-tight mb-1 sm:mb-2">
                      Platform Dashboard
                    </h2>
                    <p className="text-xs sm:text-sm lg:text-base text-[#A3AED0] font-semibold">
                      Monitor user activity, growth trends, and platform health
                      metrics in real-time
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#5D5FEF]" />
                    <div>
                      <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider">
                        Last Updated
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-[#1B2559]">
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {dashboard && (
                  <>
                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                      <MetricCard
                        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
                        label="Total Users"
                        value={dashboard.totalUsers}
                        gradient="from-blue-500 to-blue-600"
                        bgLight="bg-blue-50"
                        textColor="text-blue-600"
                      />

                      <MetricCard
                        icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6" />}
                        label="Active Users"
                        value={dashboard.active7Days}
                        subtitle="Last 7 days"
                        gradient="from-green-500 to-emerald-600"
                        bgLight="bg-green-50"
                        textColor="text-green-600"
                      />

                      <MetricCard
                        icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
                        label="New This Week"
                        value={dashboard.newWeek}
                        gradient="from-purple-500 to-purple-600"
                        bgLight="bg-purple-50"
                        textColor="text-purple-600"
                      />

                      <MetricCard
                        icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                        label="Verified Users"
                        value={dashboard.verified}
                        gradient="from-indigo-500 to-indigo-600"
                        bgLight="bg-indigo-50"
                        textColor="text-indigo-600"
                      />
                    </div>

                    {/* Secondary Stats - Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Verification Status Card */}
                      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <div>
                            <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-black text-[#A3AED0] uppercase tracking-wider mb-1">
                              Account Status
                            </p>
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#1B2559]">
                              Verification
                            </h3>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-[#A3AED0] uppercase">
                                  Verified
                                </p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-black text-green-600">
                                  {dashboard.verified}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-green-600">
                                {(
                                  (dashboard.verified / dashboard.totalUsers) *
                                  100
                                ).toFixed(0)}
                                %
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-100">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-[#A3AED0] uppercase">
                                  Pending
                                </p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-black text-amber-600">
                                  {dashboard.unverified}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-amber-600">
                                {(
                                  (dashboard.unverified /
                                    dashboard.totalUsers) *
                                  100
                                ).toFixed(0)}
                                %
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(dashboard.verified / dashboard.totalUsers) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Chart Card - Spans 2 columns */}
                      <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                          <div>
                            <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-black text-[#A3AED0] uppercase tracking-wider mb-1">
                              User Growth
                            </p>
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#1B2559]">
                              Daily Registrations
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#5D5FEF]/10 rounded-lg sm:rounded-xl">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#5D5FEF]" />
                            <span className="text-xs sm:text-sm font-bold text-[#5D5FEF]">
                              +12.5% this week
                            </span>
                          </div>
                        </div>

                        <DailyUsersChart data={dashboard.dailyUsers} />
                      </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="bg-gradient-to-br from-[#5D5FEF] to-[#868CFF] rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl shadow-indigo-200/50 text-white">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <Activity className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-wider opacity-90">
                              Platform Health
                            </p>
                          </div>
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-2">
                            Everything's Running Smoothly
                          </h3>
                          <p className="text-white/80 font-semibold text-xs sm:text-sm lg:text-base">
                            Your platform is performing exceptionally well with
                            strong user engagement
                          </p>
                        </div>

                        <div className="flex gap-4 sm:gap-6">
                          <div className="text-center">
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">
                              {dashboard.active7Days}
                            </p>
                            <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider opacity-80">
                              Active Now
                            </p>
                          </div>
                          <div className="w-px bg-white/20" />
                          <div className="text-center">
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">
                              {(
                                (dashboard.active7Days / dashboard.totalUsers) *
                                100
                              ).toFixed(0)}
                              %
                            </p>
                            <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider opacity-80">
                              Engagement
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === "users" ? (
              /* --- USER LIST TAB --- */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B2559] tracking-tight">
                    User Directory
                  </h2>
                  <p className="text-[#A3AED0] font-bold text-xs sm:text-sm mt-1">
                    Showing {indexOfFirstItem + 1}-
                    {Math.min(indexOfLastItem, directoryUsers.length)} of{" "}
                    {directoryUsers.length} standard accounts
                  </p>
                </header>

                <div className="bg-white rounded-2xl sm:rounded-[35px] shadow-xl shadow-gray-200/50 overflow-hidden border border-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                      <thead className="bg-[#F7F9FC] text-[#A3AED0] text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
                            User Details
                          </th>
                          <th className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
                            Status
                          </th>
                          <th className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
                            Joined
                          </th>
                          <th className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {usersLoading ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-12 sm:py-16"
                            >
                              <div className="flex justify-center items-center">
                                <div className="animate-spin w-8 h-8 border-4 border-[#5D5FEF] border-t-transparent rounded-full" />
                              </div>
                            </td>
                          </tr>
                        ) : currentItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-12 sm:py-16"
                            >
                              <div className="flex flex-col items-center justify-center gap-3 text-[#A3AED0]">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F4F7FE] rounded-xl sm:rounded-2xl flex items-center justify-center">
                                  <Users
                                    size={28}
                                    className="text-[#5D5FEF] sm:w-8 sm:h-8"
                                  />
                                </div>
                                <p className="font-bold text-base sm:text-lg text-[#1B2559]">
                                  No Users Found
                                </p>
                                <p className="text-xs sm:text-sm">
                                  There are currently no standard users in the
                                  system.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((u: any) => (
                            <tr
                              key={u.id}
                              className="hover:bg-[#F4F7FE]/50 transition-all duration-200 group"
                            >
                              <td className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-[#F4F7FE] text-[#5D5FEF] rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm group-hover:bg-[#5D5FEF] group-hover:text-white transition-all">
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs sm:text-sm lg:text-base text-[#1B2559]">
                                      {u.name}
                                    </div>
                                    <div className="text-[9px] sm:text-[10px] lg:text-xs text-[#A3AED0] font-semibold">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5">
                                {u.isVerified ? (
                                  <span className="flex items-center gap-1 sm:gap-1.5 text-green-500 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase bg-green-50 px-2 sm:px-3 py-1 rounded-lg w-fit">
                                    <CheckCircle2
                                      size={8}
                                      className="sm:w-2 sm:h-2 lg:w-3 lg:h-3"
                                    />{" "}
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 sm:gap-1.5 text-amber-500 text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase bg-amber-50 px-2 sm:px-3 py-1 rounded-lg w-fit">
                                    <Calendar
                                      size={8}
                                      className="sm:w-2 sm:h-2 lg:w-3 lg:h-3"
                                    />{" "}
                                    Pending
                                  </span>
                                )}
                              </td>

                              <td className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5 text-xs sm:text-sm font-bold text-[#1B2559]/60">
                                {u.createdAt}
                              </td>

                              <td className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5">
                                <div className="flex items-center justify-center gap-1 sm:gap-2 lg:gap-3">
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setViewModal(true);
                                    }}
                                    className="p-1.5 sm:p-2 lg:p-2.5 bg-[#F4F7FE] text-[#5D5FEF] hover:bg-[#5D5FEF] hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"
                                  >
                                    <Eye
                                      size={14}
                                      className="sm:w-[15px] sm:h-[15px] lg:w-[16px] lg:h-[16px]"
                                    />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setEditForm({
                                        id: u.id,
                                        name: u.name,
                                        role: u.role,
                                        isVerified: u.isVerified,
                                      });
                                      setEditModal(true);
                                    }}
                                    className="p-1.5 sm:p-2 lg:p-2.5 bg-[#F4F7FE] text-[#1B2559] hover:bg-[#1B2559] hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"
                                  >
                                    <Pencil
                                      size={14}
                                      className="sm:w-[15px] sm:h-[15px] lg:w-[16px] lg:h-[16px]"
                                    />
                                  </button>

                                  <button
                                    onClick={() => openDeleteModal(u.id)}
                                    className="p-1.5 sm:p-2 lg:p-2.5 bg-[#F4F7FE] text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"
                                  >
                                    <Trash2
                                      size={14}
                                      className="sm:w-[15px] sm:h-[15px] lg:w-[16px] lg:h-[16px]"
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 bg-[#F7F9FC] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border-t border-gray-100">
                    <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-[#A3AED0]">
                      Page <span className="text-[#1B2559]">{currentPage}</span>{" "}
                      of {totalPages}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => paginate(currentPage - 1)}
                        className={`p-1 sm:p-1.5 lg:p-2 rounded-lg border transition-all ${currentPage === 1 ? "bg-gray-100 text-gray-300 border-transparent cursor-not-allowed" : "bg-white text-[#1B2559] border-gray-200 hover:border-[#5D5FEF] hover:text-[#5D5FEF] active:scale-90 shadow-sm"}`}
                      >
                        <ChevronLeft
                          size={14}
                          className="sm:w-[15px] sm:h-[15px] lg:w-[16px] lg:h-[16px]"
                        />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (num) => (
                          <button
                            key={num}
                            onClick={() => paginate(num)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg font-black text-[9px] sm:text-[10px] lg:text-xs transition-all ${currentPage === num ? "bg-[#5D5FEF] text-white shadow-lg shadow-indigo-100" : "bg-white text-[#A3AED0] hover:text-[#1B2559] border border-gray-100"}`}
                          >
                            {num}
                          </button>
                        ),
                      )}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => paginate(currentPage + 1)}
                        className={`p-1 sm:p-1.5 lg:p-2 rounded-lg border transition-all ${currentPage === totalPages ? "bg-gray-100 text-gray-300 border-transparent cursor-not-allowed" : "bg-white text-[#1B2559] border-gray-200 hover:border-[#5D5FEF] hover:text-[#5D5FEF] active:scale-90 shadow-sm"}`}
                      >
                        <ChevronRight
                          size={14}
                          className="sm:w-[15px] sm:h-[15px] lg:w-[16px] lg:h-[16px]"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "products" ? (
              <ProductsTab />
            ) : activeTab === "wishlists" ? (
              <WishlistsTab />
            ) : activeTab === "reviews" ? (
              <ReviewsTab />
            ) : activeTab === "addresses" ? (
              <AddressesTab />
            ) : activeTab === "carts" ? (
              <CartsTab />
            ) : activeTab === "orders"?(
              <OrdersTab />
            ) : activeTab === "promos" ? (
              <PromoCodesTab />
            ) : activeTab === "payments"?(
              <PaymentsTab />
            ):null}

            {toast && (
              <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[200] animate-in slide-in-from-right duration-300">
                <div
                  className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl font-bold text-xs sm:text-sm ${
                    toast.type === "success"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {toast.message}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      {viewModal && selectedUser && (
        <Modal title="User Profile" close={() => setViewModal(false)}>
          <div className="relative animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-14">
              <div className="h-28 w-full bg-gradient-to-tr from-[#1B2559] via-[#3A497E] to-[#5D5FEF] rounded-[32px] overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="p-1.5 bg-white rounded-[35px] shadow-2xl shadow-indigo-200/50">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F4F7FE] text-[#5D5FEF] rounded-[28px] flex items-center justify-center text-3xl sm:text-4xl font-black border-4 border-white">
                    {selectedUser.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mb-8">
              <h4 className="text-xl sm:text-2xl font-black text-[#1B2559] tracking-tight">
                {selectedUser.name}
              </h4>
              <p className="text-[#A3AED0] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 mt-1">
                <Mail size={12} className="sm:w-3 sm:h-3 text-[#5D5FEF]" />{" "}
                {selectedUser.email}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-[#F4F7FE] rounded-full border border-white shadow-sm">
                <span
                  className={`w-2 h-2 rounded-full ${selectedUser.isVerified ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
                />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#1B2559]/70">
                  {selectedUser.isVerified
                    ? "Verified Account"
                    : "Pending Verification"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-3 sm:p-4 rounded-[24px] bg-[#F7F9FC] border border-white hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck
                    size={14}
                    className="sm:w-4 sm:h-4 text-[#5D5FEF]"
                  />
                  <span className="text-[8px] sm:text-[9px] font-black text-[#A3AED0] uppercase tracking-tighter">
                    Permission
                  </span>
                </div>
                <p className="font-bold text-xs sm:text-sm text-[#1B2559] group-hover:scale-105 transition-transform origin-left capitalize">
                  {selectedUser.role}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-[24px] bg-[#F7F9FC] border border-white hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar
                    size={14}
                    className="sm:w-4 sm:h-4 text-[#5D5FEF]"
                  />
                  <span className="text-[8px] sm:text-[9px] font-black text-[#A3AED0] uppercase tracking-tighter">
                    Joined Date
                  </span>
                </div>
                <p className="font-bold text-xs sm:text-sm text-[#1B2559] group-hover:scale-105 transition-transform origin-left">
                  {new Date(selectedUser.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" },
                  )}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {editModal && selectedUser && (
        <Modal title="Edit Account Details" close={() => setEditModal(false)}>
          <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4 mb-2 p-4 bg-[#F4F7FE]/50 rounded-[25px] border border-dashed border-[#E9EDF7]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#5D5FEF] text-white rounded-xl flex items-center justify-center font-black">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-[#A3AED0] tracking-widest">
                  Editing User
                </p>
                <p className="font-bold text-xs sm:text-sm text-[#1B2559] leading-tight">
                  {selectedUser.name}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[8px] sm:text-[10px] font-black uppercase text-[#A3AED0] ml-3 tracking-[0.15em]">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <UserIcon
                    size={16}
                    className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]"
                  />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-bold transition-all outline-none text-[#1B2559] text-sm sm:text-base shadow-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] sm:text-[10px] font-black uppercase text-[#A3AED0] ml-3 tracking-[0.15em]">
                  Access Level / Role
                </label>
                <div className="relative mt-1.5">
                  <ShieldCheck
                    size={16}
                    className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#5D5FEF]"
                  />
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    disabled={true}
                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-bold transition-all outline-none text-[#1B2559] text-sm sm:text-base cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] sm:text-[10px] font-black uppercase text-[#A3AED0] ml-3 tracking-[0.15em]">
                  Verification Status
                </label>
                <div className="relative mt-1.5">
                  <CheckCircle2
                    size={16}
                    className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 ${selectedUser.isVerified ? "text-green-500" : "text-amber-500"}`}
                  />
                  <select
                    value={editForm.isVerified ? "true" : "false"}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isVerified: e.target.value === "true",
                      }))
                    }
                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#F4F7FE] border-2 border-transparent focus:border-[#5D5FEF] focus:bg-white font-bold transition-all outline-none text-[#1B2559] text-sm sm:text-base cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="true">Verified Account</option>
                    <option value="false">Unverified / Restricted</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] sm:text-[10px] font-black uppercase text-[#A3AED0] ml-3 tracking-[0.15em]">
                  Email Address (System ID)
                </label>
                <div className="relative mt-1.5 opacity-60">
                  <Mail
                    size={16}
                    className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#A3AED0]"
                  />
                  <input
                    type="email"
                    defaultValue={selectedUser.email}
                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#F4F7FE] border-2 border-gray-100 font-bold outline-none text-[#A3AED0] text-sm sm:text-base cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setEditModal(false)}
                className="py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[#A3AED0] bg-[#F4F7FE] hover:bg-gray-200 transition-all active:scale-95 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                disabled={savingEdit}
                onClick={() =>
                  handleSaveEdit({
                    id: editForm.id,
                    name: editForm.name,
                    role: editForm.role,
                    isVerified: editForm.isVerified,
                  })
                }
                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-white bg-[#1B2559] hover:bg-[#5D5FEF] shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  savingEdit ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {savingEdit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && userToDelete && (
        <Modal title="Delete User" close={closeDeleteModal}>
          <div className="space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-red-50 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" />
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="text-center space-y-2">
              <h4 className="text-base sm:text-lg lg:text-xl font-black text-[#1B2559]">
                Are you absolutely sure?
              </h4>
              <p className="text-xs sm:text-sm lg:text-base text-[#A3AED0] font-semibold">
                This action cannot be undone. This will permanently delete the
                user account and remove all associated data from the system.
              </p>
            </div>

            {/* User Info */}
            <div className="p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-red-500 text-white rounded-xl flex items-center justify-center font-black text-sm sm:text-base">
                  {users
                    .find((u: any) => u.id === userToDelete)
                    ?.name.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-[#1B2559]">
                    {users.find((u: any) => u.id === userToDelete)?.name ||
                      "Unknown User"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#A3AED0] font-semibold">
                    {users.find((u: any) => u.id === userToDelete)?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[#1B2559] bg-[#F4F7FE] hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                disabled={deleting}
                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm ${
                  deleting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md">
          <div
            className="absolute inset-0 bg-[#1B2559]/40"
            onClick={() => setShowProfile(false)}
          />
          <div className="bg-white w-full max-w-[280px] sm:max-w-sm rounded-[35px] sm:rounded-[50px] p-6 sm:p-8 lg:p-10 relative z-10 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-[#5D5FEF] rounded-[28px] sm:rounded-[35px] mx-auto mb-4 sm:mb-5 lg:mb-6 flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-black shadow-2xl shadow-indigo-100">
              {user.name.charAt(0)}
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#1B2559] mb-2">
              {user.name}
            </h3>
            <p className="text-[#A3AED0] font-bold text-xs sm:text-sm lg:text-base mb-6 sm:mb-8 lg:mb-10">
              {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-[#1B2559] text-white py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:bg-[#EE5D50] active:scale-95 shadow-lg group text-sm sm:text-base"
            >
              <LogOut
                size={16}
                className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform"
              />{" "}
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${active ? "text-[#5D5FEF]" : "text-[#8A94A6] hover:text-[#5D5FEF]"}`}
    >
      {active && (
        <div className="absolute inset-0 bg-white shadow-xl shadow-indigo-100/40 rounded-2xl z-0 border border-indigo-50/50" />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10 font-bold text-sm tracking-tight">
        {label}
      </span>
      {active && (
        <div className="ml-auto relative z-10 w-1.5 h-6 bg-[#5D5FEF] rounded-full" />
      )}
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
  bgLight,
  textColor,
}: any) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${bgLight} rounded-xl sm:rounded-2xl flex items-center justify-center ${textColor} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-black text-[#A3AED0] uppercase tracking-wider mb-1 sm:mb-1.5 lg:mb-2">
          {label}
        </p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1B2559] mb-1">
          {value?.toLocaleString() || 0}
        </p>
        {subtitle && (
          <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-[#A3AED0]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function Modal({ children, title, close }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 lg:p-6 backdrop-blur-xl bg-white/10">
      <div className="absolute inset-0" onClick={close} />
      <div className="bg-white w-full max-w-[90%] sm:max-w-md rounded-[30px] sm:rounded-[35px] lg:rounded-[50px] shadow-2xl relative z-10 p-5 sm:p-6 lg:p-10 animate-in fade-in zoom-in-95 duration-300 border border-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#1B2559] tracking-tight">
            {title}
          </h3>
          <button
            onClick={close}
            className="p-1.5 sm:p-2 hover:bg-[#F4F7FE] rounded-full text-[#A3AED0] transition-colors"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
