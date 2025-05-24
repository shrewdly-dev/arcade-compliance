"use client";

import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ChartBarIcon,
    description: "Overview & analytics",
  },
  {
    name: "Organization",
    href: "/onboarding",
    icon: BuildingOfficeIcon,
    description: "Organization management",
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: ShieldCheckIcon,
    description: "Compliance management",
  },
  {
    name: "Training",
    href: "/training",
    icon: AcademicCapIcon,
    description: "Staff training programs",
  },
  {
    name: "Documents",
    href: "/documents",
    icon: DocumentTextIcon,
    description: "Compliance documents",
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isAuthenticated = status === "authenticated";
  const isCurrentPath = (href: string) => pathname === href;

  return (
    <header className="relative">
      {/* Glassmorphism Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="group -m-1.5 p-1.5"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Arcade Compliance
                  </span>
                  <div className="text-xs text-gray-400 font-medium">
                    Shrewdly for Business
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Only show if authenticated */}
          {isAuthenticated && (
            <div className="hidden lg:flex lg:gap-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isCurrent = isCurrentPath(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-4 py-2 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/30"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {!isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex flex-1 items-center justify-end gap-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-white">
                        {session?.user?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {session?.user?.email}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/10">
                        <div className="text-sm font-medium text-white">
                          {session?.user?.name || "User"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session?.user?.email}
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <UserCircleIcon className="h-5 w-5" />
                          <span>Profile Settings</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          <span>Account Settings</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Unauthenticated Actions */}
                <Link
                  href="/auth/login"
                  className="hidden text-sm font-semibold text-gray-300 hover:text-white lg:block transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Sign up</span>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-slate-900/95 backdrop-blur-xl px-6 py-6 sm:max-w-sm border-l border-white/10">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="-m-1.5 p-1.5"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Arcade Compliance
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-white/10">
              {isAuthenticated && (
                <div className="space-y-2 py-6">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isCurrent = isCurrentPath(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center space-x-3 rounded-xl px-3 py-3 text-base font-semibold transition-all duration-200 ${
                          isCurrent
                            ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/30"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <div>
                          <div>{item.name}</div>
                          <div className="text-xs text-gray-400">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Mobile User Actions */}
              <div className="py-6">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-3 bg-white/5 rounded-xl">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {session?.user?.name || "User"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 rounded-xl px-3 py-3 text-base font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <UserCircleIcon className="h-6 w-6" />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center space-x-3 rounded-xl px-3 py-3 text-base font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-6 w-6" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl px-3 py-3 text-base font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-3 text-base font-semibold text-white text-center shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>
    </header>
  );
}
