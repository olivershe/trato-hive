"use client";

import { useView } from "./ViewContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#FF8042'];

export function AnalyticsView() {
    const { deals } = useView();

    // Data 1: Pipeline Value by Stage
    const pipelineData = [
        { name: 'Sourcing', value: deals.filter(d => d.stage === 'SOURCING').reduce((acc, curr) => acc + curr.intValue, 0) },
        { name: 'Diligence', value: deals.filter(d => d.stage === 'DILIGENCE').reduce((acc, curr) => acc + curr.intValue, 0) },
        { name: 'Closing', value: deals.filter(d => d.stage === 'CLOSING').reduce((acc, curr) => acc + curr.intValue, 0) },
    ];

    // Data 2: Deal Count by Stage (for Pie)
    const countData = [
        { name: 'Sourcing', value: deals.filter(d => d.stage === 'SOURCING').length },
        { name: 'Diligence', value: deals.filter(d => d.stage === 'DILIGENCE').length },
        { name: 'Closing', value: deals.filter(d => d.stage === 'CLOSING').length },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: "compact",
            maximumFractionDigits: 1
        }).format(value);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Value Pipeline */}
            <div className="bg-white dark:bg-deep-grey p-6 rounded-lg border border-gold/20 shadow-sm">
                <h3 className="text-lg font-bold text-charcoal dark:text-cultured-white mb-6 font-serif">
                    Pipeline Value by Stage
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipelineData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip
                                formatter={(value: any) => [formatCurrency(value) as string, 'Value']}
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Deal Count Distribution */}
            <div className="bg-white dark:bg-deep-grey p-6 rounded-lg border border-gold/20 shadow-sm">
                <h3 className="text-lg font-bold text-charcoal dark:text-cultured-white mb-6 font-serif">
                    Deal Concentration
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={countData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {countData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
