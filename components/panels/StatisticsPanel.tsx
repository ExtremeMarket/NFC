import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { ChartBarIcon, CurrencyDollarIcon, DownloadIcon } from '../icons';
import { Transaction } from '../../types';

const StatisticsPanel: React.FC = () => {
    const { cards, transactions, users, currentUser, products } = useAppContext();
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(products.length > 0 ? [products[0].id] : []);
    
    const spendingData = useMemo(() => {
        const spendingMap = new Map<string, number>();
        transactions.forEach(t => {
            const currentSpent = spendingMap.get(t.cardId) || 0;
            spendingMap.set(t.cardId, currentSpent + t.total);
        });

        const cardToUserMap = new Map<string, string>();
        users.forEach(u => {
            u.cardIds.forEach(cardId => {
                cardToUserMap.set(cardId, u.username);
            });
        });
        
        const data = cards.map(card => ({
            cardId: card.id,
            username: cardToUserMap.get(card.id) || 'Unlinked',
            totalSpent: spendingMap.get(card.id) || 0,
        }));

        return data.sort((a, b) => b.totalSpent - a.totalSpent);
    }, [transactions, users, cards]);

    const hourlyRevenue = useMemo(() => {
        const revenue: { [hour: number]: number } = {};
        transactions.forEach(t => {
            const hour = new Date(t.timestamp).getHours();
            revenue[hour] = (revenue[hour] || 0) + t.total;
        });
        return revenue;
    }, [transactions]);
    
    const productSalesByHour = useMemo(() => {
        const sales: { [productId: string]: { [hour: number]: { quantity: number; revenue: number } } } = {};
        transactions.forEach(t => {
            const hour = new Date(t.timestamp).getHours();
            t.items.forEach(item => {
                if (!sales[item.productId]) {
                    sales[item.productId] = {};
                }
                if (!sales[item.productId][hour]) {
                    sales[item.productId][hour] = { quantity: 0, revenue: 0 };
                }
                sales[item.productId][hour].quantity += item.quantity;
                sales[item.productId][hour].revenue += item.price * item.quantity;
            });
        });
        return sales;
    }, [transactions]);
    
    const handleProductSelection = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };
    
    const exportTransactionsToExcel = () => {
        const xmlHeader = `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
         xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
          <Worksheet ss:Name="Transactions">
            <Table>`;
        
        const xmlFooter = `</Table>
          </Worksheet>
        </Workbook>`;

        const headerRow = `<Row>
            <Cell><Data ss:Type="String">Card ID</Data></Cell>
            <Cell><Data ss:Type="String">Total (◎)</Data></Cell>
            <Cell><Data ss:Type="String">Items</Data></Cell>
            <Cell><Data ss:Type="String">Date</Data></Cell>
        </Row>`;

        const dataRows = transactions.map(t => {
            const itemsStr = t.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
            // Basic XML escaping
            const sanitizedItemsStr = itemsStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            return `<Row>
                <Cell><Data ss:Type="String">${t.cardId}</Data></Cell>
                <Cell><Data ss:Type="Number">${t.total}</Data></Cell>
                <Cell><Data ss:Type="String">${sanitizedItemsStr}</Data></Cell>
                <Cell><Data ss:Type="String">${new Date(t.timestamp).toLocaleString()}</Data></Cell>
            </Row>`;
        }).join('');

        const xml = xmlHeader + headerRow + dataRows + xmlFooter;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
a.href = url;
        a.download = 'transactions.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    if (!currentUser) {
        return (
            <Card title="Access Denied">
                <p className="text-center text-gray-400">Please log in to view statistics.</p>
            </Card>
        );
    }
    
    const maxHourlyRevenue = Math.max(1, ...Object.values(hourlyRevenue));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const maxProductQuantity = useMemo(() => {
        let max = 1;
        selectedProductIds.forEach(pid => {
            if (productSalesByHour[pid]) {
                const maxQty = Math.max(...Object.values(productSalesByHour[pid]).map(d => d.quantity));
                if (maxQty > max) max = maxQty;
            }
        });
        return max;
    }, [productSalesByHour, selectedProductIds]);
    
    const productColors = useMemo(() => {
        const colors = ['bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-lime-500'];
        const colorMap: { [id: string]: string } = {};
        products.forEach((p, index) => {
            colorMap[p.id] = colors[index % colors.length];
        });
        return colorMap;
    }, [products]);


    return (
        <div className="space-y-8">
            <Card title="Revenue by Hour" icon={<ChartBarIcon className="w-6 h-6 text-teal-400"/>}>
                <div className="w-full overflow-x-auto no-scrollbar">
                    <div className="min-w-[768px] h-72 flex items-end justify-between space-x-1 p-4 bg-gray-900/50 rounded-lg">
                        {hours.map(hour => {
                            const revenue = hourlyRevenue[hour] || 0;
                            const height = (revenue / maxHourlyRevenue) * 100;
                            return (
                                 <div key={hour} className="w-8 flex flex-col items-center h-full justify-end" title={`Hour: ${hour}:00, Revenue: ${revenue} ◎`}>
                                    <div className="relative w-full bg-teal-500 rounded-t-sm hover:bg-teal-400 transition-colors" style={{ height: `${height}%` }}>
                                        {height > 10 && (
                                            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold drop-shadow-md">
                                                {revenue}◎
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1">{hour}h</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Card>

             <Card title="Product Sales by Hour" icon={<ChartBarIcon className="w-6 h-6 text-teal-400"/>}>
                <div className="mb-4 flex flex-wrap gap-2">
                    {products.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleProductSelection(p.id)}
                            className={`px-3 py-1 text-sm rounded-full transition-all ${selectedProductIds.includes(p.id) ? `${productColors[p.id]} text-white shadow-lg` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                 <div className="p-4 bg-gray-900/50 rounded-lg flex items-end">
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between h-80 w-12 text-xs text-gray-400 text-right pr-4">
                        <span>{maxProductQuantity}</span>
                        <span>{Math.ceil(maxProductQuantity / 2)}</span>
                        <span>0</span>
                    </div>
                    
                    {/* Chart bars container */}
                    <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
                        <div className="min-w-[768px] h-80 flex items-end justify-between space-x-1 border-l border-b border-gray-700 pl-1">
                            {hours.map(hour => (
                                <div key={hour} className="relative w-8 flex flex-col items-center h-full justify-end">
                                    <div className="relative w-full h-full flex items-end justify-center space-x-px">
                                        {selectedProductIds.map(pid => {
                                            const sale = productSalesByHour[pid] && productSalesByHour[pid][hour];
                                            const quantity = sale ? sale.quantity : 0;
                                            const revenue = sale ? sale.revenue : 0;
                                            const height = (quantity / maxProductQuantity) * 100;
                                            const productName = products.find(p => p.id === pid)?.name || 'Unknown';
                                            return (
                                                <div 
                                                    key={`${pid}-${hour}`}
                                                    className={`relative w-full ${productColors[pid]} rounded-t-sm hover:opacity-80 transition-opacity`}
                                                    style={{ height: `${height}%` }}
                                                    title={`${productName} @ ${hour}:00\nQuantity: ${quantity}\nRevenue: ${revenue} ◎`}
                                                >
                                                {selectedProductIds.length === 1 && height > 10 && (
                                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold drop-shadow-md">
                                                        {revenue}◎
                                                    </span>
                                                )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1">{hour}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Spending Leaderboard" icon={<ChartBarIcon className="w-6 h-6 text-teal-400"/>}>
                    <div className="overflow-x-auto overflow-y-auto no-scrollbar max-h-[calc(100vh-20rem)]">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Rank</th>
                                    <th scope="col" className="px-6 py-3">Card / User</th>
                                    <th scope="col" className="px-6 py-3">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {spendingData.map((data, index) => (
                                    <tr key={data.cardId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4 font-semibold">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold">{data.username !== 'Unlinked' ? data.username : 'N/A'}</div>
                                            <div className="font-mono text-xs text-gray-400">{data.cardId}</div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{data.totalSpent} ◎</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                
                <Card 
                    title="Global Transaction Log" 
                    icon={<CurrencyDollarIcon className="w-6 h-6 text-teal-400"/>}
                    headerActions={
                        <Button onClick={exportTransactionsToExcel} variant="secondary" className="flex items-center !px-3 !py-1.5 text-sm">
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    }
                >
                    <div className="overflow-x-auto overflow-y-auto no-scrollbar max-h-[calc(100vh-20rem)]">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Card ID</th>
                                    <th scope="col" className="px-6 py-3">Total</th>
                                    <th scope="col" className="px-6 py-3">Items</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4 font-mono">{t.cardId}</td>
                                        <td className="px-6 py-4 font-semibold">{t.total} ◎</td>
                                        <td className="px-6 py-4">
                                            {t.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4">{new Date(t.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StatisticsPanel;