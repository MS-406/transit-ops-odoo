import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

const COLORS = ['#06C167', '#276EF1', '#FFC043', '#E11900', '#5B21B6', '#1F2937'];

export const DashboardAnalytics = ({ analyticsData }) => {
  if (!analyticsData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Vehicle Status Distribution */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="text-gray-500" size={18} />
            <h3 className="text-sm font-extrabold text-uber-black uppercase tracking-wider">
              Vehicle Status
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analyticsData.vehicleStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.vehicleStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Driver Status Distribution */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="text-gray-500" size={18} />
            <h3 className="text-sm font-extrabold text-uber-black uppercase tracking-wider">
              Driver Status
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analyticsData.driverStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.driverStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Fuel Expenses */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-gray-500" size={18} />
            <h3 className="text-sm font-extrabold text-uber-black uppercase tracking-wider">
              Monthly Fuel Cost ($)
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.monthlyFuelExpenses}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#F3F4F6'}} />
              <Bar dataKey="value" fill="#276EF1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Operational Cost Per Vehicle */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-gray-500" size={18} />
            <h3 className="text-sm font-extrabold text-uber-black uppercase tracking-wider">
              Op Cost by Vehicle ($)
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.operationalCostPerVehicle}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#F3F4F6'}} />
              <Bar dataKey="value" fill="#E11900" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
