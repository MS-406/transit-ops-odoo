import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { auditLogger } from '../../utils/auditLogger';
import { Shield, Search, Calendar, User, Clock, FilterX } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load logs on mount
    setLogs(auditLogger.getLogs());
  }, []);

  const handleClear = () => {
    setSearchTerm('');
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'USER_LOGIN':
        return 'bg-blue-50 text-uber-blue border-uber-blue/20';
      case 'DISPATCH_TRIP':
        return 'bg-green-50 text-uber-green border-uber-green/20';
      case 'CREATE_VEHICLE':
      case 'CREATE_DRIVER':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'OPEN_MAINTENANCE':
        return 'bg-amber-50 text-uber-amber border-uber-amber/20';
      case 'DELETE_VEHICLE':
        return 'bg-red-50 text-uber-red border-uber-red/20';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="text-left animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
            Security / Compliance
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase flex items-center gap-2">
            <Shield className="text-uber-blue shrink-0" size={28} /> Audit Trails
          </h2>
        </div>
      </div>

      {/* Filter panel */}
      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search audit trail by action, description, or operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {searchTerm && (
            <button
              onClick={handleClear}
              className="text-xs uppercase font-extrabold tracking-wider text-uber-red hover:underline shrink-0 px-2 py-3 flex items-center gap-1.5"
            >
              <FilterX size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Audit table logs */}
      {filteredLogs.length === 0 ? (
        <Card className="py-16 text-center">
          <Shield size={36} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-uber-black uppercase">No Audit Matches</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            No system compliance logs match your query parameters. Try widening your search strings.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-uber-gray-300 bg-gray-50 text-gray-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6"><Clock size={14} className="inline mr-1" /> Timestamp</th>
                  <th className="py-4 px-6">Action Category</th>
                  <th className="py-4 px-6"><User size={14} className="inline mr-1" /> Triggered By</th>
                  <th className="py-4 px-6">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uber-gray-300">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-uber-gray-100/40 transition-colors duration-150"
                  >
                    <td className="py-4 px-6 font-medium text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide font-bold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-700 whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
};
