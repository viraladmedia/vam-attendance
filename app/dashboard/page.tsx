// app/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Clock, AlertCircle, Loader } from "lucide-react";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const { stats, sessions } = useDashboardData();

  // Format stats for display
  const statsData = [
    {
      title: "Avg Attendance Rate",
      value: `${stats.avgAttendanceRate}%`,
      icon: TrendingUp,
      trend: "Across all teachers",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Students",
      value: stats.totalStudents.toString(),
      icon: Users,
      trend: `${stats.totalEnrollments} enrollments`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Courses",
      value: stats.totalCourses.toString(),
      icon: Calendar,
      trend: `${stats.weekSessions} sessions this week`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
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

  const upcomingSessions = React.useMemo(
    () =>
      sessions
        .slice()
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .filter((s) => new Date(s.starts_at).getTime() >= Date.now()),
    [sessions]
  );
  const nextSession = upcomingSessions[0];

  return (
    <div className="w-full">
      <TopBar subtitle="Overview" title="Dashboard Overview" />

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
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <p className="text-xs text-slate-500">Next up for this month</p>
              </div>
              <Link href="/dashboard/sessions" className="text-sm font-medium text-fuchsia-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 6).map((session) => {
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
                              {session.title || "Session"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {dateStr} • {timeStr}
                            </p>
                            {session.class_name && (
                              <p className="text-xs text-slate-600 mt-1">
                                {session.class_name}
                              </p>
                            )}
                          </div>
                          {session.description && (
                            <p className="ml-3 max-w-[220px] text-xs text-slate-500 line-clamp-3">
                              {session.description}
                            </p>
                          )}
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
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/dashboard/attendance">Mark Attendance</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/dashboard/sessions">Create Session</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/dashboard/students">Manage Students</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href="/dashboard/courses">Manage Courses</Link>
              </Button>
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
              {nextSession && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <AlertCircle className="h-5 w-5 text-slate-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Next session</p>
                    <p className="text-sm text-slate-700">
                      {nextSession.title || "Session"} •{" "}
                      {new Date(nextSession.starts_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/sessions"
                    className="text-xs font-semibold text-fuchsia-600 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              )}
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
