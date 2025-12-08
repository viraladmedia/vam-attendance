// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { useAccount } from "@/components/dashboard/AccountContext";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Clock, AlertCircle, Loader } from "lucide-react";
import { useDashboardData } from "@/lib/hooks/useDashboardData";

export default function OverviewPage() {
  const { accountId } = useAccount();
  const { stats, sessions } = useDashboardData();

  // Format stats for display
  const statsData = [
    {
      title: "Total Students",
      value: stats.totalStudents.toString(),
      icon: Users,
      trend: `${stats.totalStudents > 0 ? "+" : ""}0%`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "This Week Sessions",
      value: stats.weekSessions.toString(),
      icon: Calendar,
      trend: `${stats.weekSessions} scheduled`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg Attendance Rate",
      value: `${stats.avgAttendanceRate}%`,
      icon: TrendingUp,
      trend: "Across all teachers",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions.toString(),
      icon: Clock,
      trend: "Right now",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="w-full">
      <TopBar subtitle="Overview" title="Campaign Performance" />

      {/* Loading State */}
      {stats.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-fuchsia-600" />
          <p className="ml-3 text-slate-600">Loading dashboard data...</p>
        </div>
      )}

      {/* Error State */}
      {stats.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-800">
            <span className="font-semibold">Error:</span> {stats.error}
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      {!stats.loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsData.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-500">{stat.trend}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      {!stats.loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => {
                    const startTime = new Date(session.starts_at);
                    const timeStr = startTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const dateStr = startTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={session.id}
                        className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {session.title}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {session.class_name}
                            </p>
                            {session.description && (
                              <p className="text-xs text-slate-500 mt-1">
                                {session.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {timeStr}
                            </p>
                            <p className="text-xs text-slate-500">{dateStr}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500">No sessions scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition">
                Mark Attendance
              </button>
              <button className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition">
                Generate Report
              </button>
              <button className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition">
                Create Session
              </button>
              <button className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition">
                Manage Students
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {!stats.loading && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.avgAttendanceRate < 80 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">Attendance Alert</p>
                    <p className="text-sm text-yellow-700">
                      Average attendance is {stats.avgAttendanceRate}%, below 80% threshold
                    </p>
                  </div>
                </div>
              )}

              {sessions.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Active Sessions</p>
                    <p className="text-sm text-blue-700">
                      {stats.weekSessions} sessions scheduled for this week
                    </p>
                  </div>
                </div>
              )}

              {stats.totalStudents > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Students Managed</p>
                    <p className="text-sm text-green-700">
                      {stats.totalStudents} students across all classes
                    </p>
                  </div>
                </div>
              )}

              {stats.totalStudents === 0 && sessions.length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <AlertCircle className="h-5 w-5 text-slate-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Getting Started</p>
                    <p className="text-sm text-slate-700">
                      Create your first session and add students to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
