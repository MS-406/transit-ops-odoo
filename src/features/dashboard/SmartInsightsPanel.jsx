import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const SmartInsightsPanel = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="mb-6 shadow-sm border-gray-200">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-uber-amber" size={20} />
          <h3 className="text-sm font-extrabold text-uber-black uppercase tracking-wider">
            Smart Operational Insights
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {insights.map((insight, idx) => {
            const isUp = insight.trend?.includes('↑');
            const isDown = insight.trend?.includes('↓');
            return (
              <div
                key={idx}
                className="flex flex-col p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">
                  {insight.label}
                </span>
                <span className="text-lg font-extrabold text-uber-black leading-tight mb-2 truncate">
                  {insight.value}
                </span>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-semibold text-gray-500">
                    {insight.subtext}
                  </span>
                  {insight.trend && (
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        isUp ? 'text-uber-green' : isDown ? 'text-uber-red' : 'text-uber-blue'
                      }`}
                    >
                      {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
                      {insight.trend.replace(/[↑↓]/g, '').trim()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
