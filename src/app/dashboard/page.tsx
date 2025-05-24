"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {session?.user?.name || session?.user?.email}!
                  👋
                </h1>
                <p className="text-purple-200 text-lg">
                  Manage your arcade compliance with confidence
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/admin/email-test"
                  className="inline-flex items-center px-4 py-2 border border-purple-300/50 text-sm font-medium rounded-lg text-purple-200 bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-sm transition-all duration-200"
                >
                  🧪 Test Emails
                </a>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Compliance Status */}
          <Card className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-300/30 backdrop-blur-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">✅</span>
                Compliance Status
              </CardTitle>
              <CardDescription className="text-emerald-200">
                Current compliance overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-emerald-300 mb-2">
                  98%
                </div>
                <p className="text-emerald-200 text-lg font-medium">
                  Excellent Compliance
                </p>
                <div className="mt-4 bg-emerald-900/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-green-400 h-3 rounded-full"
                    style={{ width: "98%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Training */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-300/30 backdrop-blur-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Staff Training
              </CardTitle>
              <CardDescription className="text-blue-200">
                Training completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-300 mb-2">
                  12/15
                </div>
                <p className="text-blue-200 text-lg font-medium">
                  Staff Trained
                </p>
                <div className="mt-4 bg-blue-900/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-violet-600/20 border-purple-300/30 backdrop-blur-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Documents
              </CardTitle>
              <CardDescription className="text-purple-200">
                Compliance documents status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-300 mb-2">8</div>
                <p className="text-purple-200 text-lg font-medium">
                  Up to Date
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="bg-purple-600/30 rounded-full px-4 py-2">
                    <span className="text-purple-200 text-sm font-medium">
                      All Current
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-orange-300/30 backdrop-blur-lg shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                Recent Activity
              </CardTitle>
              <CardDescription className="text-orange-200">
                Latest compliance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-orange-900/20 rounded-lg p-3">
                  <span className="text-white font-medium">
                    License renewal
                  </span>
                  <span className="text-orange-300 text-sm bg-orange-600/30 px-2 py-1 rounded-full">
                    2 days ago
                  </span>
                </div>
                <div className="flex items-center justify-between bg-orange-900/20 rounded-lg p-3">
                  <span className="text-white font-medium">
                    Staff training completed
                  </span>
                  <span className="text-orange-300 text-sm bg-orange-600/30 px-2 py-1 rounded-full">
                    1 week ago
                  </span>
                </div>
                <div className="flex items-center justify-between bg-orange-900/20 rounded-lg p-3">
                  <span className="text-white font-medium">Policy update</span>
                  <span className="text-orange-300 text-sm bg-orange-600/30 px-2 py-1 rounded-full">
                    2 weeks ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="bg-gradient-to-br from-red-500/20 to-pink-600/20 border-red-300/30 backdrop-blur-lg shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                Upcoming Tasks
              </CardTitle>
              <CardDescription className="text-red-200">
                Tasks requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-red-900/20 rounded-lg p-3 border-l-4 border-red-400">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      Annual compliance review
                    </span>
                    <span className="text-red-300 text-sm font-bold">
                      30 days
                    </span>
                  </div>
                  <p className="text-red-200 text-sm mt-1">High Priority</p>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-3 border-l-4 border-yellow-400">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      Staff refresher training
                    </span>
                    <span className="text-yellow-300 text-sm font-bold">
                      60 days
                    </span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-1">
                    Medium Priority
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border-indigo-300/30 backdrop-blur-lg shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">🚀</span>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-indigo-200">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 hover:text-white transition-all duration-200 transform hover:scale-105">
                  <span className="flex items-center">
                    <span className="mr-3">📄</span>
                    View compliance documents
                  </span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 hover:text-white transition-all duration-200 transform hover:scale-105">
                  <span className="flex items-center">
                    <span className="mr-3">📚</span>
                    Schedule staff training
                  </span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 hover:text-white transition-all duration-200 transform hover:scale-105">
                  <span className="flex items-center">
                    <span className="mr-3">📊</span>
                    Generate compliance report
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">99.2%</div>
            <div className="text-sm text-gray-300">Uptime</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">24/7</div>
            <div className="text-sm text-gray-300">Monitoring</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">15</div>
            <div className="text-sm text-gray-300">Active Users</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">3</div>
            <div className="text-sm text-gray-300">Locations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
