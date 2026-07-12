import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import { vehiclesApi } from '../../api/vehicles';
import { expensesApi } from '../../api/expenses';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, FileSpreadsheet, Download, BarChart2, DollarSign, Fuel, Award } from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

export const Reports = () => {
  // Query Reports
  const { data: efficiency, isLoading: isEffLoading } = useQuery({
    queryKey: ['report-efficiency'],
    queryFn: reportsApi.getFuelEfficiency,
    select: (res) => res.data
  });

  const { data: utilization, isLoading: isUtilLoading } = useQuery({
    queryKey: ['report-utilization'],
    queryFn: reportsApi.getUtilization,
    select: (res) => res.data
  });

  const { data: costs, isLoading: isCostLoading } = useQuery({
    queryKey: ['report-cost'],
    queryFn: reportsApi.getCost,
    select: (res) => res.data
  });

  const { data: roi, isLoading: isRoiLoading } = useQuery({
    queryKey: ['report-roi'],
    queryFn: reportsApi.getRoi,
    select: (res) => res.data
  });

  // Query raw fleet data for exports
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data
  });

  const { data: fuelLogs } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: () => expensesApi.getFuelLogs(),
    select: (res) => res.data
  });

  // EXPORT 1: CSV
  const handleExportCSV = () => {
    if (!vehicles) {
      toast.error('Data not loaded yet.');
      return;
    }

    // Prepare vehicles data sheet
    const csvData = vehicles.map(v => {
      const fuelCost = (v.fuel_logs || []).reduce((sum, l) => sum + l.cost, 0);
      const maintCost = (v.maintenance_records || []).reduce((sum, r) => sum + r.cost, 0);
      return {
        'Registration Plate': v.registration_number,
        'Model Name': v.model,
        'Classification': v.type,
        'Cargo Capacity (Tons)': v.capacity,
        'Odometer (km)': v.odometer,
        'Operations Region': v.region,
        'Fleet Status': v.status,
        'Fuel Expenses ($)': fuelCost,
        'Maintenance Expenses ($)': maintCost,
        'Total Rollup Cost ($)': fuelCost + maintCost
      };
    });

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Fleet Report downloaded successfully.');
  };

  // EXPORT 2: PDF
  const handleExportPDF = () => {
    if (!vehicles || !costs) {
      toast.error('Data not loaded.');
      return;
    }

    const doc = new jsPDF();
    
    // Premium stark PDF header design (Uber style)
    doc.setFillColor(20, 22, 26); // dark-gray
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('TRANSITOPS', 15, 22);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(6, 193, 103); // accent green
    doc.text('SMART TRANSPORT OPERATIONS LEDGER', 15, 28);
    
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 150, 22);

    // Section 1: Summary Statistics
    doc.setTextColor(20, 22, 26);
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Fleet Financial Summary', 15, 52);

    doc.setDrawColor(226, 226, 226); // gray-300
    doc.line(15, 55, 195, 55);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    
    let yPos = 65;
    costs.forEach(c => {
      doc.text(`${c.name}:`, 15, yPos);
      doc.setFont('Helvetica', 'bold');
      doc.text(`$${c.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 120, yPos);
      doc.setFont('Helvetica', 'normal');
      yPos += 8;
    });

    const grandTotal = costs.reduce((sum, c) => sum + c.cost, 0);
    doc.line(15, yPos + 2, 195, yPos + 2);
    doc.setFont('Helvetica', 'bold');
    doc.text('Total Operational Spending:', 15, yPos + 10);
    doc.setTextColor(39, 110, 241); // Blue
    doc.text(`$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 120, yPos + 10);

    // Section 2: Fleet Overview list
    doc.setTextColor(20, 22, 26);
    doc.setFontSize(14);
    doc.text('Active Vehicle Logbook', 15, yPos + 30);
    doc.line(15, yPos + 33, 195, yPos + 33);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('Plate', 15, yPos + 42);
    doc.text('Model & Type', 40, yPos + 42);
    doc.text('Region', 105, yPos + 42);
    doc.text('Odometer', 145, yPos + 42);
    doc.text('Status', 175, yPos + 42);
    
    doc.setFont('Helvetica', 'normal');
    doc.line(15, yPos + 44, 195, yPos + 44);

    let listY = yPos + 51;
    vehicles.slice(0, 10).forEach(v => {
      doc.text(v.registration_number, 15, listY);
      doc.text(`${v.model} (${v.type})`, 40, listY);
      doc.text(v.region, 105, listY);
      doc.text(`${v.odometer.toLocaleString()} km`, 145, listY);
      doc.text(v.status, 175, listY);
      listY += 7;
    });

    doc.save(`TransitOps_Operational_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Operational PDF summary generated.');
  };

  const isLoading = isEffLoading || isUtilLoading || isCostLoading || isRoiLoading;

  // Chart Custom Colors (Premium stark palette)
  const UBER_COLORS = ['#276EF1', '#06C167', '#FFC043', '#E11900'];

  return (
    <div className="text-left animate-fade-in">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Operations / Analytics
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
            Reports & Insights
          </h2>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2 border-gray-300"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <Download size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-uber-black" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 select-none">
          
          {/* Chart 1: Fleet Utilization Rate */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <BarChart2 size={16} /> Fleet Utilization Trend
              </h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#276EF1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#276EF1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E2E2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} domain={[40, 100]} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                  <Area type="monotone" dataKey="rate" stroke="#276EF1" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Operational Cost Slices */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <DollarSign size={16} /> Costs Slices Breakdown
              </h3>
            </CardHeader>
            <CardContent className="h-72 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costs}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="cost"
                    >
                      {costs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UBER_COLORS[index % UBER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend details */}
              <div className="w-1/2 flex flex-col gap-3 pl-4 text-xs">
                {costs.map((item, idx) => (
                  <div key={item.name} className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: UBER_COLORS[idx % UBER_COLORS.length] }}></span>
                      <span className="font-bold text-gray-600 truncate">{item.name}</span>
                    </div>
                    <span className="font-extrabold pl-5 text-uber-black text-sm">${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: Fuel Efficiency */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Fuel size={16} /> Vehicle Fuel Efficiency (km/L)
              </h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiency} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E2E2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} km/L`, 'Efficiency']} />
                  <Bar dataKey="efficiency" fill="#06C167" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {efficiency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.efficiency >= 6.5 ? '#06C167' : '#FFC043'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: ROI per Vehicle Class */}
          <Card>
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Award size={16} /> Classification ROI Summary
              </h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roi} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E2E2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="cost" name="Oper. Cost" fill="#E11900" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="revenue" name="Dispatches Revenue" fill="#276EF1" radius={[2, 2, 0, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
};
