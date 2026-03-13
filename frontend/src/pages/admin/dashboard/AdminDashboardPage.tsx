import { useState } from "react"
import DashboardLayout from '../../../components/layout/DashboardLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card"
import { Input } from "../../../components/ui/Input"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  AlertCircle,
  Search,
} from "lucide-react"

/* -------------------- DATA -------------------- */
const communityMoodData = [
  { date: "Jan 1", avgMood: 3.5 },
  { date: "Jan 5", avgMood: 3.7 },
  { date: "Jan 10", avgMood: 3.9 },
  { date: "Jan 15", avgMood: 4.1 },
  { date: "Jan 20", avgMood: 4.0 },
  { date: "Jan 25", avgMood: 4.2 },
  { date: "Jan 30", avgMood: 4.3 },
]

const userStatsData = [
  { status: "Active", count: 245 },
  { status: "Inactive", count: 82 },
  { status: "New", count: 38 },
]

const activityData = [
  { time: "12:00 AM", checkins: 45 },
  { time: "3:00 AM", checkins: 12 },
  { time: "6:00 AM", checkins: 34 },
  { time: "9:00 AM", checkins: 67 },
  { time: "12:00 PM", checkins: 89 },
  { time: "3:00 PM", checkins: 94 },
  { time: "6:00 PM", checkins: 82 },
  { time: "9:00 PM", checkins: 71 },
]

const COLORS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-chart-3)",
]

const recentUsers = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", joinDate: "2024-01-15", status: "Active" },
  { id: 2, name: "Mike Chen", email: "mike@example.com", joinDate: "2024-01-18", status: "Active" },
  { id: 3, name: "Emma Davis", email: "emma@example.com", joinDate: "2024-01-20", status: "Inactive" },
  { id: 4, name: "Alex Martinez", email: "alex@example.com", joinDate: "2024-01-22", status: "Active" },
]

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  return (
    <DashboardLayout title="Admin Dashboard" userType="admin">
        <div className="px-4 py-8 space-y-8 max-w-[1600px] mx-auto transition-all duration-300">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric title="Total Users" value="365" note="+12 this week" />
            <Metric title="Active Users" value="245" note="67% of total" accent />
            <Metric title="Today Check-ins" value="1,247" note="↑ 8% from yesterday" />
            <Metric title="Community Avg Mood" value="4.3/5" note="↑ 0.2 this month" accent />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Community Mood Trend">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={communityMoodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="avgMood" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Check-in Activity">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="checkins" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Users */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ChartCard title="User Status">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={userStatsData} dataKey="count" outerRadius={80}>
                    {userStatsData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <Card className="lg:col-span-2 shadow-sm border-border">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest registered users</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <Input
                    className="pl-10"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 px-2">Name</th>
                        <th className="pb-3 px-2">Email</th>
                        <th className="pb-3 px-2">Joined</th>
                        <th className="pb-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u) => (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u.id)}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedUser === u.id ? "bg-muted" : ""
                          }`}
                        >
                          <td className="py-3 px-2 font-medium">{u.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                          <td className="py-3 px-2 text-muted-foreground">{u.joinDate}</td>
                          <td className="py-3 px-2">
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                               u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                             }`}>
                                {u.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card className="border-yellow-200 bg-yellow-50/50 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-800 text-lg">
                <AlertCircle className="w-5 h-5" /> System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-yellow-700 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  ⚠️ Unusual Activity Detected in APAC region
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  ℹ️ Daily backup completed (Success Rate: 100%)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  )
}

/* -------------------- HELPERS -------------------- */
function Metric({
  title,
  value,
  note,
  accent,
}: {
  title: string
  value: string
  note: string
  accent?: boolean
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold tracking-tight ${accent ? "text-accent" : "text-primary"}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{note}</p>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
