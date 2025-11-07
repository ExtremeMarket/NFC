

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card as CardType, Transaction } from '../../types';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Card from '../shared/Card';
import { CurrencyDollarIcon, ReceiptTaxIcon, LinkIcon } from '../icons';
import Modal from '../shared/Modal';


const UserPanel: React.FC = () => {
    const { currentUser, getCard, getTransactionsForCard, linkCard, products } = useAppContext();
    const [cardToLink, setCardToLink] = useState('');
    const [message, setMessage] = useState({type: '', text: ''});
    const [isPriceListModalOpen, setPriceListModalOpen] = useState(false);

    const userCard: CardType | undefined = useMemo(() => {
        if (currentUser && currentUser.cardIds.length > 0) {
            return getCard(currentUser.cardIds[0]); // Assuming one card per user for now
        }
        return undefined;
    }, [currentUser, getCard]);

    const cardTransactions: Transaction[] = useMemo(() => {
        if (userCard) {
            return getTransactionsForCard(userCard.id);
        }
        return [];
    }, [userCard, getTransactionsForCard]);
    
    const handleLinkCard = () => {
        if (!currentUser) return;
        const result = linkCard(currentUser.id, cardToLink);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) {
            setCardToLink('');
        }
         setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    
    if (!currentUser) {
        return (
             <Card title="Access Denied">
                <p className="text-center text-gray-400">Please log in to view your wallet.</p>
            </Card>
        )
    }

    if (!userCard) {
        return (
             <div className="max-w-md mx-auto">
                 <Card title="Link Your Event Card" icon={<LinkIcon className="w-6 h-6 text-teal-400"/>}>
                    <p className="text-center text-gray-400 mb-4">Welcome, {currentUser.username}! Link your card to see your balance and history.</p>
                     <div className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder="Enter your Card ID"
                            value={cardToLink}
                            onChange={e => setCardToLink(e.target.value)}
                        />
                        <Button onClick={handleLinkCard}>Link Card</Button>
                    </div>
                     {message.text && <p className={`text-center text-sm mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
                </Card>
             </div>
        )
    }
    
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-end">
                <Button 
                    onClick={() => setPriceListModalOpen(true)} 
                    variant="secondary"
                    className="flex items-center"
                >
                    <ReceiptTaxIcon className="w-5 h-5 mr-2"/>
                    Cenovnik za večeras
                </Button>
            </div>
            <div className="mt-4 space-y-8">
                <Card title="Current Balance" icon={<CurrencyDollarIcon className="w-6 h-6 text-teal-400"/>}>
                    <div className="text-center">
                        <p className="text-gray-400">Card ID: <span className="font-mono">{userCard.id}</span></p>
                        <p className="text-5xl font-bold text-teal-400 mt-2">{userCard.balance} ◎</p>
                    </div>
                </Card>
                
                <Card title="Transaction History" icon={<ReceiptTaxIcon className="w-6 h-6 text-teal-400"/>}>
                    <div className="overflow-x-auto overflow-y-auto no-scrollbar max-h-96">
                        {cardTransactions.length > 0 ? (
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Date</th>
                                        <th scope="col" className="px-4 py-3">Items</th>
                                        <th scope="col" className="px-4 py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cardTransactions.map(t => (
                                        <tr key={t.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                            <td className="px-4 py-4">{new Date(t.timestamp).toLocaleString()}</td>
                                            <td className="px-4 py-4">
                                                    {t.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-red-400">-{t.total} ◎</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-400 py-4">No transactions found for this card.</p>
                        )}
                    </div>
                </Card>
            </div>

            <Modal isOpen={isPriceListModalOpen} onClose={() => setPriceListModalOpen(false)} title="Cenovnik za večeras">
                <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                    <p className="text-center text-gray-400 text-sm mb-4">Sve cene su izražene u tokenima (◎)</p>
                    <div className="space-y-3">
                        {products && products.length > 0 ? (
                            products.map(product => (
                                <div key={product.id} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors duration-200">
                                    <span className="text-lg font-medium text-gray-100">{product.name}</span>
                                    <span className="text-xl font-bold text-teal-400">{product.price} ◎</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 py-4">Cenovnik trenutno nije dostupan.</p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserPanel;