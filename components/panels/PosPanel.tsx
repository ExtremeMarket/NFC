import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CartItem, Product, Card as CardType, User } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Card from '../shared/Card';
import { ShoppingCartIcon, XCircleIcon, SearchIcon, TrashIcon } from '../icons';

const PosPanel: React.FC = () => {
    const { products, processPayment, getCard, users } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentCardId, setPaymentCardId] = useState('');
    const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });
    
    // State for the new scan feature
    const [scanCardId, setScanCardId] = useState('');
    const [scannedCardInfo, setScannedCardInfo] = useState<{ card: CardType; owner: User | null } | null>(null);
    const [scanMessage, setScanMessage] = useState('');


    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addToCart = (product: Product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === product.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
    };
    
    const removeFromCart = (productId: string) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === productId);
            if (existingItem && existingItem.quantity > 1) {
                return currentCart.map(item => item.id === productId ? {...item, quantity: item.quantity - 1} : item);
            }
            return currentCart.filter(item => item.id !== productId);
        });
    };
    
    const clearCart = () => {
        setCart([]);
    };

    const handlePayment = () => {
        if (paymentCardId) {
             const card = getCard(paymentCardId);
            if (card && card.status === 'inactive') {
                setPaymentMessage({ type: 'error', text: 'This card is deactivated and cannot be used.' });
                return;
            }
            const result = processPayment(paymentCardId, cart);
            setPaymentMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setCart([]);
                setTimeout(() => {
                    setPaymentModalOpen(false);
                    setPaymentMessage({ type: '', text: '' });
                    setPaymentCardId('');
                }, 2000);
            } else if (result.message.includes('Insufficient funds')) {
                setTimeout(() => {
                    setPaymentModalOpen(false);
                    setPaymentMessage({ type: '', text: '' });
                    setPaymentCardId('');
                }, 3500);
            }
        }
    };
    
    const openPaymentModal = () => {
        if(cart.length > 0) {
            setPaymentModalOpen(true);
            setPaymentMessage({ type: '', text: '' });
        }
    };
    
    const handleScanCard = () => {
        if (!scanCardId) {
            setScanMessage('Please enter a Card ID.');
            setScannedCardInfo(null);
            return;
        }

        const card = getCard(scanCardId);
        if (!card) {
            setScanMessage('Card not found.');
            setScannedCardInfo(null);
            return;
        }

        const owner = users.find(u => u.cardIds.includes(scanCardId)) || null;
        setScannedCardInfo({ card, owner });
        setScanMessage('');
        setScanCardId('');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Products */}
            <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4 text-teal-400">Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                        <button key={product.id} onClick={() => addToCart(product)} className="bg-gray-800 p-4 rounded-lg shadow-lg hover:bg-teal-500 hover:scale-105 transition-all duration-200 ease-in-out text-left focus:outline-none focus:ring-2 focus:ring-teal-400">
                            <h3 className="font-semibold text-white">{product.name}</h3>
                            <p className="text-gray-400">{product.price} ◎</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Column: Cart & Scan */}
            <div className="md:col-span-1 space-y-8">
                <Card 
                    title="Cart" 
                    icon={<ShoppingCartIcon className="w-6 h-6 text-teal-400"/>}
                    headerActions={
                        cart.length > 0 && (
                            <button onClick={clearCart} className="text-gray-400 hover:text-red-400 transition-colors" title="Clear Cart">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        )
                    }
                >
                    {cart.length === 0 ? (
                        <p className="text-gray-400 text-center">Cart is empty</p>
                    ) : (
                        <div className="space-y-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                    <div>
                                        <p className="font-semibold">{item.name} <span className="text-gray-400">x{item.quantity}</span></p>
                                        <p className="text-sm text-gray-300">{(item.price * item.quantity)} ◎</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300">
                                        <XCircleIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="border-t border-gray-700 mt-4 pt-4">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>{total} ◎</span>
                        </div>
                        <Button onClick={openPaymentModal} disabled={cart.length === 0} fullWidth className="mt-4">
                            Proceed to Payment
                        </Button>
                    </div>
                </Card>
                
                <Card title="Scan Card" icon={<SearchIcon className="w-6 h-6 text-teal-400" />}>
                    <div className="space-y-3">
                        <div className="flex space-x-2">
                            <Input
                                type="text"
                                placeholder="Enter Card ID to check"
                                value={scanCardId}
                                onChange={e => setScanCardId(e.target.value)}
                            />
                            <Button onClick={handleScanCard}>Check</Button>
                        </div>
                        {scanMessage && <p className="text-center text-sm text-red-400">{scanMessage}</p>}
                        {scannedCardInfo && (
                            <div className="mt-4 p-4 bg-gray-700 rounded-lg space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Card ID:</span>
                                    <span className="font-mono text-sm">{scannedCardInfo.card.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Owner:</span>
                                    <span className="font-semibold">{scannedCardInfo.owner?.username || 'Unlinked'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Balance:</span>
                                    <span className="text-xl font-bold text-teal-400">{scannedCardInfo.card.balance} ◎</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-300">Status:</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        scannedCardInfo.card.status === 'active' 
                                            ? 'bg-green-200 text-green-900' 
                                            : 'bg-red-200 text-red-900'
                                    }`}>
                                        {scannedCardInfo.card.status}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            
            <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Process Payment">
                <div className="text-center mb-4">
                    <p className="text-gray-400">Total Amount</p>
                    <p className="text-4xl font-bold text-teal-400">{total} ◎</p>
                </div>
                <div className="space-y-4">
                    <Input 
                        type="text" 
                        placeholder="Scan or Enter Card ID" 
                        value={paymentCardId} 
                        onChange={e => setPaymentCardId(e.target.value)} 
                        autoFocus
                    />
                    <Button onClick={handlePayment} fullWidth>Confirm Payment</Button>
                    {paymentMessage.text && (
                        <p className={`text-center text-sm mt-2 ${paymentMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {paymentMessage.text}
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PosPanel;