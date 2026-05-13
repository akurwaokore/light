"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const revenueData = [
  { month: "Jan", memberships: 450000, marketplace: 180000, events: 95000, donations: 320000 },
  { month: "Feb", memberships: 520000, marketplace: 210000, events: 110000, donations: 380000 },
  { month: "Mar", memberships: 480000, marketplace: 240000, events: 125000, donations: 450000 },
  { month: "Apr", memberships: 610000, marketplace: 280000, events: 140000, donations: 520000 },
  { month: "May", memberships: 680000, marketplace: 320000, events: 160000, donations: 580000 },
  { month: "Jun", memberships: 750000, marketplace: 380000, events: 190000, donations: 640000 },
]

const revenueBreakdown = [
  { name: "Memberships", value: 3490000, color: "#3b82f6", percentage: 48 },
  { name: "Marketplace", value: 1610000, color: "#8b5cf6", percentage: 22 },
  { name: "Events", value: 820000, color: "#10b981", percentage: 11 },
  { name: "Donations", value: 2890000, color: "#f59e0b", percentage: 19 },
]

const expensesData = [
  { category: "Operations", amount: 850000, budget: 900000, percentage: 94 },
  { category: "Marketing", amount: 420000, budget: 500000, percentage: 84 },
  { category: "Technology", amount: 620000, budget: 650000, percentage: 95 },
  { category: "Events", amount: 380000, budget: 400000, percentage: 95 },
  { category: "Staff", amount: 1200000, budget: 1200000, percentage: 100 },
]

const recentTransactions = [
  {
    id: "TXN-001",
    type: "membership",
    amount: 10000,
    user: "Sarah Wanjiku",
    status: "completed",
    method: "M-Pesa",
    date: "2024-12-01 10:30",
  },
  {
    id: "TXN-002",
    type: "marketplace",
    amount: 45000,
    user: "James Ochieng",
    status: "completed",
    method: "PayPal",
    date: "2024-12-01 09:15",
  },
  {
    id: "TXN-003",
    type: "donation",
    amount: 25000,
    user: "Grace Muthoni",
    status: "pending",
    method: "M-Pesa",
    date: "2024-12-01 08:45",
  },
  {
    id: "TXN-004",
    type: "event",
    amount: 5000,
    user: "Peter Kamau",
    status: "completed",
    method: "M-Pesa",
    date: "2024-12-01 07:20",
  },
  {
    id: "TXN-005",
    type: "marketplace",
    amount: 120000,
    user: "Alice Njeri",
    status: "failed",
    method: "PayPal",
    date: "2024-11-30 18:30",
  },
]

const pendingPayouts = [
  { id: "PO-001", seller: "David Omondi", amount: 78000, earnings: 82000, commission: 4000, items: 5 },
  { id: "PO-002", seller: "Mary Wangari", amount: 145000, earnings: 152000, commission: 7000, items: 8 },
  { id: "PO-003", seller: "John Mwangi", amount: 34000, earnings: 36000, commission: 2000, items: 2 },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

export default function FinanceDashboard() {
  const [dateRange, setDateRange] = useState("month")
  const [transactionFilter, setTransactionFilter] = useState("all")

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0)
  const totalExpenses = expensesData.reduce((sum, item) => sum + item.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Comprehensive financial overview and controls</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(totalRevenue / 1000000).toFixed(2)}M</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+23.1%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(totalExpenses / 1000000).toFixed(2)}M</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <ArrowDownRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">-5.2%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(netProfit / 1000000).toFixed(2)}M</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+31.5%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin}%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+2.3%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="memberships"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="marketplace"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="events"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="donations"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Distribution by revenue source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {revenueBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">KES {(item.value / 1000000).toFixed(2)}M</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment activities</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search transactions..." className="pl-8 w-[200px]" />
                  </div>
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="membership">Memberships</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="event">Events</SelectItem>
                      <SelectItem value="donation">Donations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                      <TableCell>{txn.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">KES {txn.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {txn.method}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(txn.status)}
                          {getStatusBadge(txn.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{txn.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>Seller earnings awaiting approval</CardDescription>
                </div>
                <Button>Process All Payouts</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Gross Earnings</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs">{payout.id}</TableCell>
                      <TableCell className="font-medium">{payout.seller}</TableCell>
                      <TableCell>KES {payout.earnings.toLocaleString()}</TableCell>
                      <TableCell className="text-red-500">-KES {payout.commission.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-green-500">KES {payout.amount.toLocaleString()}</TableCell>
                      <TableCell>{payout.items} items</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Expense Management</CardTitle>
              <CardDescription>Budget allocation and spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expensesData.map((expense) => (
                  <div key={expense.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">
                          KES {expense.amount.toLocaleString()} of KES {expense.budget.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={expense.percentage > 95 ? "destructive" : "secondary"}>
                        {expense.percentage}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${expense.percentage > 95 ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${expense.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
