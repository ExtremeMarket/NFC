import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card as CardType, Product, Transaction, User, UserRole } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Card from '../shared/Card';
import { PlusCircleIcon, CurrencyDollarIcon, UserAddIcon, TrashIcon, KeyIcon, TableCellsIcon, ReceiptTaxIcon, UserCircleIcon, PencilIcon, SwitchHorizontalIcon } from '../icons';
import SliderToggle from '../shared/SliderToggle';

const AdminPanel: React.FC = () => {
    const { 
        products, users, addProduct, issueCard, topUpCard, deleteProduct, 
        adminResetPassword, currentUser, cards, getTransactionsForCard,
        // Fix: Add getCard to the destructuring assignment.
        updateCardStatus, correctCardBalance, transferCardData, getCard
    } = useAppContext();
    
    // Modals visibility state
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [isIssueCardModalOpen, setIssueCardModalOpen] = useState(false);
    const [isTopUpModalOpen, setTopUpModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [isCardDetailsModalOpen, setCardDetailsModalOpen] = useState(false);

    // Form inputs state
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [issuedCard, setIssuedCard] = useState<CardType | null>(null);
    const [topUpCardId, setTopUpCardId] = useState('');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    
    // Messages and selected items state
    const [topUpMessage, setTopUpMessage] = useState({ type: '', text: '' });
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
    const [cardOwner, setCardOwner] = useState<User | null>(null);
    
    // Card Details Modal state
    const [correctionAmount, setCorrectionAmount] = useState('');
    const [correctionReason, setCorrectionReason] = useState('');
    const [transferNewCardId, setTransferNewCardId] = useState('');
    const [detailsMessage, setDetailsMessage] = useState({ type: '', text: '' });

    const passwordResetRequests = useMemo(() => {
        return users.filter(u => u.passwordResetRequested);
    }, [users]);
    
    const allCardsData = useMemo(() => {
        const cardToUserMap = new Map<string, string>();
        users.forEach(u => u.cardIds.forEach(cardId => cardToUserMap.set(cardId, u.username)));

        return cards.map(card => ({
            ...card,
            linkedUser: cardToUserMap.get(card.id) || 'Unlinked',
        })).sort((a,b) => b.balance - a.balance);
    }, [cards, users]);

    // Handlers
    const handleAddProduct = () => {
        if (newProductName && newProductPrice) {
            addProduct(newProductName, parseFloat(newProductPrice));
            setNewProductName(''); setNewProductPrice(''); setProductModalOpen(false);
        }
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) deleteProduct(productId);
    }
    
    const handleIssueCard = () => {
        if (initialBalance) {
            const newCard = issueCard(parseFloat(initialBalance));
            setIssuedCard(newCard); setInitialBalance('');
        }
    };

    const handleTopUpCard = () => {
        if (topUpCardId && topUpAmount) {
            const success = topUpCard(topUpCardId, parseFloat(topUpAmount));
            setTopUpMessage({ type: success ? 'success' : 'error', text: success ? 'Top-up successful!' : 'Card ID not found.' });
            if (success) { setTopUpCardId(''); setTopUpAmount(''); }
            setTimeout(() => setTopUpMessage({ type: '', text: '' }), 3000);
        }
    };
    
    const openResetModal = (user: User) => {
        setUserToReset(user); setNewPassword(''); setResetMessage({ type: '', text: '' }); setResetPasswordModalOpen(true);
    };

    const handleResetPassword = () => {
        if (userToReset && newPassword) {
            const result = adminResetPassword(userToReset.id, newPassword);
            setResetMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) setTimeout(() => { setResetPasswordModalOpen(false); setUserToReset(null); }, 1500);
        }
    }

    const handleCardRowClick = (card: CardType) => {
        if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
            return;
        }
        const owner = users.find(u => u.cardIds.includes(card.id)) || null;
        setSelectedCard(card);
        setCardOwner(owner);
        setDetailsMessage({type: '', text: ''});
        setCorrectionAmount('');
        setCorrectionReason('');
        setTransferNewCardId('');
        setCardDetailsModalOpen(true);
    };

    const handleStatusChange = (newStatus: boolean) => {
        if (selectedCard) {
            const status = newStatus ? 'active' : 'inactive';
            updateCardStatus(selectedCard.id, status);
            setSelectedCard({...selectedCard, status });
        }
    };
    
    const handleCorrection = () => {
        if (selectedCard && correctionAmount && correctionReason) {
            const amount = parseFloat(correctionAmount);
            const result = correctCardBalance(selectedCard.id, amount, correctionReason);
            setDetailsMessage({type: result.success ? 'success' : 'error', text: result.message});
            if (result.success) {
                const updatedCard = getCard(selectedCard.id);
                if (updatedCard) setSelectedCard(updatedCard);
                setCorrectionAmount(''); setCorrectionReason('');
            }
            setTimeout(() => setDetailsMessage({type: '', text: ''}), 3000);
        }
    };
    
    const handleTransfer = () => {
        if(selectedCard && transferNewCardId) {
            if(window.confirm(`Are you sure you want to transfer all data from ${selectedCard.id} to ${transferNewCardId}? This action cannot be undone.`)) {
                const result = transferCardData(selectedCard.id, transferNewCardId);
                setDetailsMessage({type: result.success ? 'success' : 'error', text: result.message});
                if (result.success) {
                    setTimeout(() => setCardDetailsModalOpen(false), 2000);
                }
            }
        }
    }

    if (!currentUser) {
        return <Card title="Access Denied"><p className="text-center text-gray-400">Please log in to view the admin panel.</p></Card>
    }
    
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8">
                <Card title="Card Management" icon={<UserAddIcon className="w-6 h-6 text-teal-400"/>}>
                    <div className="space-y-4">
                        <Button onClick={() => { setIssueCardModalOpen(true); setIssuedCard(null); }} fullWidth>Issue New Card</Button>
                        <Button onClick={() => setTopUpModalOpen(true)} fullWidth variant="secondary">Top-Up Card</Button>
                    </div>
                </Card>

                {isSuperAdmin && (
                  <>
                    <Card title="Password Reset Requests" icon={<KeyIcon className="w-6 h-6 text-teal-400"/>}>
                         <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                            {passwordResetRequests.length > 0 ? passwordResetRequests.map(user => (
                                <li key={user.id} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                    <span className="font-semibold">{user.username}</span>
                                    <Button onClick={() => openResetModal(user)} variant="secondary" className="px-3 py-1 text-sm">Reset</Button>
                                </li>
                            )) : <p className="text-gray-400 text-center">No pending requests.</p> }
                        </ul>
                    </Card>

                    <Card title="Product Management" icon={<PlusCircleIcon className="w-6 h-6 text-teal-400"/>}>
                        <Button onClick={() => setProductModalOpen(true)} fullWidth>Add New Product</Button>
                        <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                            {products.map(p => (
                                <li key={p.id} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                    <div><span>{p.name}</span><span className="text-gray-400 ml-2">{p.price} ◎</span></div>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 p-1"><TrashIcon className="w-5 h-5"/></button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                  </>
                )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
                 <Card title="All Issued Cards" icon={<TableCellsIcon className="w-6 h-6 text-teal-400"/>}>
                    <div className="overflow-x-auto overflow-y-auto no-scrollbar max-h-[calc(100vh-20rem)]">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Card ID</th>
                                    <th scope="col" className="px-6 py-3">Linked User</th>
                                    <th scope="col" className="px-6 py-3">Balance</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCardsData.map(card => (
                                    <tr key={card.id} className={`bg-gray-800 border-b border-gray-700 ${isSuperAdmin ? 'hover:bg-gray-600 cursor-pointer' : 'cursor-default'}`} onClick={() => handleCardRowClick(card)}>
                                        <td className="px-6 py-4 font-mono">{card.id}</td>
                                        <td className="px-6 py-4 font-semibold">{card.linkedUser}</td>
                                        <td className="px-6 py-4 font-semibold">{card.balance} ◎</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${card.status === 'active' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                                                {card.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            
            {/* Modals */}
            <Modal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} title="Add New Product">
                <div className="space-y-4">
                    <Input type="text" placeholder="Product Name" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                    <Input type="number" placeholder="Price (Tokens)" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                    <Button onClick={handleAddProduct} fullWidth>Add Product</Button>
                </div>
            </Modal>
            
            <Modal isOpen={isIssueCardModalOpen} onClose={() => setIssueCardModalOpen(false)} title="Issue New Card">
                 {!issuedCard ? (
                    <div className="space-y-4">
                        <Input type="number" placeholder="Initial Balance (Tokens)" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
                        <Button onClick={handleIssueCard} fullWidth>Issue Card</Button>
                    </div>
                 ) : (
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-teal-400">Card Issued Successfully!</h3>
                        <p className="mt-2">Card ID:</p>
                        <p className="text-xl font-mono bg-gray-800 p-2 rounded-md my-2">{issuedCard.id}</p>
                        <p>Balance: <span className="font-bold">{issuedCard.balance} ◎</span></p>
                        <Button onClick={() => setIssuedCard(null)} className="mt-4">Issue Another</Button>
                    </div>
                 )}
            </Modal>

            <Modal isOpen={isTopUpModalOpen} onClose={() => setTopUpModalOpen(false)} title="Top-Up Card">
                <div className="space-y-4">
                    <Input type="text" placeholder="Card ID" value={topUpCardId} onChange={e => setTopUpCardId(e.target.value)} />
                    <Input type="number" placeholder="Amount (Tokens)" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} />
                    <Button onClick={handleTopUpCard} fullWidth>Top-Up</Button>
                    {topUpMessage.text && <p className={`text-center text-sm ${topUpMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{topUpMessage.text}</p>}
                </div>
            </Modal>

            <Modal isOpen={isResetPasswordModalOpen} onClose={() => setResetPasswordModalOpen(false)} title={`Reset Password for ${userToReset?.username}`}>
                 <div className="space-y-4">
                    <Input type="text" placeholder="Enter new temporary password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
                    <Button onClick={handleResetPassword} fullWidth>Confirm Reset</Button>
                    {resetMessage.text && <p className={`text-center text-sm ${resetMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{resetMessage.text}</p>}
                </div>
            </Modal>

            {selectedCard && (
                <Modal isOpen={isCardDetailsModalOpen} onClose={() => setCardDetailsModalOpen(false)} title={`Card Details: ${selectedCard.id}`}>
                    <div className="space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar p-1">
                        <Card title="Card Overview" icon={<UserCircleIcon className="w-6 h-6 text-teal-400"/>}>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Current Balance:</span>
                                    <span className="text-2xl font-bold text-teal-400">{selectedCard.balance} ◎</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Status:</span>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-semibold ${selectedCard.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{selectedCard.status.charAt(0).toUpperCase() + selectedCard.status.slice(1)}</span>
                                        <SliderToggle checked={selectedCard.status === 'active'} onChange={handleStatusChange} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Owner:</span>
                                    <span>{cardOwner?.username || 'Unlinked'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Owner Email:</span>
                                    <span>{cardOwner?.email || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>

                        <Card title="Balance Correction" icon={<PencilIcon className="w-6 h-6 text-teal-400"/>}>
                            <div className="space-y-3">
                                <Input type="number" placeholder="Amount (e.g., 50 or -10)" value={correctionAmount} onChange={e => setCorrectionAmount(e.target.value)} />
                                <Input type="text" placeholder="Reason for correction" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} />
                                <Button onClick={handleCorrection} fullWidth>Apply Correction</Button>
                            </div>
                        </Card>

                        <Card title="Transfer to New Card" icon={<SwitchHorizontalIcon className="w-6 h-6 text-teal-400"/>}>
                            <p className="text-sm text-gray-400 mb-3">Clone this card's balance and owner to a new card. The old card will be deactivated.</p>
                            <div className="space-y-3">
                                <Input type="text" placeholder="Enter new unique Card ID" value={transferNewCardId} onChange={e => setTransferNewCardId(e.target.value)} />
                                <Button onClick={handleTransfer} fullWidth>Transfer All Data</Button>
                            </div>
                        </Card>
                         {detailsMessage.text && <p className={`text-center text-sm ${detailsMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{detailsMessage.text}</p>}

                        <Card title="Transaction History" icon={<ReceiptTaxIcon className="w-6 h-6 text-teal-400"/>}>
                            <div className="overflow-y-auto no-scrollbar max-h-60">
                                {getTransactionsForCard(selectedCard.id).length > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-300">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0"><tr><th className="px-2 py-2">Date</th><th className="px-2 py-2">Details</th><th className="px-2 py-2">Amount</th></tr></thead>
                                        <tbody>
                                            {getTransactionsForCard(selectedCard.id).map(t => (
                                                <tr key={t.id} className="bg-gray-800 border-b border-gray-700"><td className="px-2 py-3 text-xs">{new Date(t.timestamp).toLocaleString()}</td><td className="px-2 py-3">{t.items.map(i => i.productName).join(', ')}</td><td className={`px-2 py-3 font-semibold ${t.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.total} ◎</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-center text-gray-400 py-4">No transactions found.</p>}
                            </div>
                        </Card>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminPanel;
