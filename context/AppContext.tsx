import React, { createContext, useContext, ReactNode, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Product, Card, Transaction, AppContextType, CartItem, User, UserRole } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

const sampleProducts: Product[] = [
  { id: 'prod-1', name: 'Beer', price: 5 },
  { id: 'prod-2', name: 'Vodka Shot', price: 8 },
  { id: 'prod-3', name: 'Cocktail', price: 12 },
  { id: 'prod-4', name: 'Energy Drink', price: 6 },
  { id: 'prod-5', name: 'Water', price: 3 },
  { id: 'prod-6', name: 'Jäger Bomb', price: 10 },
];

const SUPER_ADMIN_CARD_ID = 'super-admin-card-001';

const sampleCards: Card[] = [
    { id: SUPER_ADMIN_CARD_ID, balance: 10000, status: 'active' },
    { id: 'user-123', balance: 100, status: 'active' },
    { id: 'user-456', balance: 35, status: 'active' },
];

const sampleUsers: User[] = [
    { id: 'u-super', username: 'superadmin', password: 'superadmin123', cardIds: [SUPER_ADMIN_CARD_ID], role: UserRole.SUPER_ADMIN, email: 'super@event.com' },
    { id: 'u-admin1', username: 'admin1', password: 'admin123', cardIds: [], role: UserRole.ADMIN, email: 'admin1@event.com' },
    { id: 'u-admin2', username: 'admin2', password: 'admin123', cardIds: [], role: UserRole.ADMIN, email: 'admin2@event.com' },
];


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('nfc-products', sampleProducts);
  const [cards, setCards] = useLocalStorage<Card[]>('nfc-cards', sampleCards);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('nfc-transactions', []);
  const [users, setUsers] = useLocalStorage<User[]>('nfc-users', sampleUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const addProduct = (name: string, price: number) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      price,
    };
    setProducts(prev => [...prev, newProduct]);
  };
  
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const issueCard = (initialBalance: number): Card => {
    const newCard: Card = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      balance: initialBalance,
      status: 'active',
    };
    setCards(prev => [...prev, newCard]);
    return newCard;
  };

  const topUpCard = (cardId: string, amount: number): boolean => {
    const cardExists = cards.some(c => c.id === cardId);
    if (!cardExists) return false;

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, balance: card.balance + amount } : card
      )
    );
    return true;
  };
  
  const getCard = (cardId: string): Card | undefined => {
    return cards.find(c => c.id === cardId);
  }

  const processPayment = (cardId: string, cart: CartItem[]): { success: boolean; message: string } => {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, message: "Card not found." };
    }
    if (card.status === 'inactive') {
        return { success: false, message: "Card is inactive." };
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (card.balance < total) {
      return { success: false, message: `Insufficient funds. Balance: ${card.balance} ◎` };
    }

    const updatedBalance = card.balance - total;
    setCards(prevCards =>
      prevCards.map(c => (c.id === cardId ? { ...c, balance: updatedBalance } : c))
    );

    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      cardId,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      timestamp: Date.now(),
    };
    setTransactions(prev => [newTransaction, ...prev]);

    return { success: true, message: `Payment successful! New balance: ${updatedBalance} ◎` };
  };
  
  const getTransactionsForCard = (cardId: string): Transaction[] => {
    return transactions.filter(txn => txn.cardId === cardId).sort((a, b) => b.timestamp - a.timestamp);
  }

  // --- Auth Functions ---
  const register = (username: string, password: string): { success: boolean; message: string } => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: "Username already exists." };
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      username,
      password, // Hashing should be used in a real app
      cardIds: [],
      role: UserRole.USER,
      email: `${username}@event.com`, // Placeholder email
      passwordResetRequested: false,
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true, message: "Registration successful! Please log in." };
  }

  const login = (username: string, password: string): { success: boolean; message: string; user?: User } => {
    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
      return { success: false, message: "Invalid username or password." };
    }
    setCurrentUser(user);
    return { success: true, message: "Login successful!", user };
  }

  const logout = () => {
    setCurrentUser(null);
  }
  
  const linkCard = (userId: string, cardId: string): { success: boolean; message: string } => {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
        return { success: false, message: "Card ID not found." };
    }

    const isCardLinked = users.some(u => u.cardIds.includes(cardId));
    if (isCardLinked) {
        return { success: false, message: "This card is already linked to another account." };
    }

    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
            const updatedUser = { ...u, cardIds: [...u.cardIds, cardId] };
            if (currentUser?.id === userId) {
              setCurrentUser(updatedUser);
            }
            return updatedUser;
        }
        return u;
    }));
    
    return { success: true, message: "Card linked successfully!" };
  };

  const requestPasswordReset = (username: string): { success: boolean; message: string } => {
    const userExists = users.some(u => u.username === username);
    if (!userExists) {
      return { success: false, message: "Username not found." };
    }

    setUsers(prevUsers => prevUsers.map(u => 
      u.username === username ? { ...u, passwordResetRequested: true } : u
    ));
    
    return { success: true, message: "Password reset request sent to administrator." };
  }

  const adminResetPassword = (userId: string, newPassword: string): { success: boolean; message: string } => {
    const userExists = users.some(u => u.id === userId);
    if (!userExists) {
        return { success: false, message: "User not found." };
    }

    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
            return { ...u, password: newPassword, passwordResetRequested: false };
        }
        return u;
    }));

    return { success: true, message: "Password has been reset successfully." };
  }

  // --- New Card Management Functions ---

  const updateCardStatus = (cardId: string, status: 'active' | 'inactive'): boolean => {
      const cardExists = cards.some(c => c.id === cardId);
      if (!cardExists) return false;
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status } : c));
      return true;
  };

  const correctCardBalance = (cardId: string, amount: number, reason: string): { success: boolean, message: string } => {
      const card = cards.find(c => c.id === cardId);
      if (!card) return { success: false, message: "Card not found." };

      const newBalance = card.balance + amount;
      if (newBalance < 0) return { success: false, message: "Correction would result in a negative balance." };

      setCards(prev => prev.map(c => c.id === cardId ? { ...c, balance: newBalance } : c));

      const correctionTransaction: Transaction = {
          id: `txn-corr-${Date.now()}`,
          cardId,
          items: [{
              productId: 'admin-correction',
              productName: `Admin: ${reason}`,
              quantity: 1,
              price: amount
          }],
          total: amount,
          timestamp: Date.now()
      };
      setTransactions(prev => [correctionTransaction, ...prev]);

      return { success: true, message: "Balance corrected successfully." };
  };

  const transferCardData = (oldCardId: string, newCardId: string): { success: boolean, message: string } => {
      if (!newCardId.trim()) return { success: false, message: "New Card ID cannot be empty." };

      const oldCard = cards.find(c => c.id === oldCardId);
      if (!oldCard) return { success: false, message: "Original card not found." };
      
      const newCardExists = cards.some(c => c.id === newCardId);
      if (newCardExists) return { success: false, message: "The new Card ID already exists." };

      const newCard: Card = {
          id: newCardId,
          balance: oldCard.balance,
          status: 'active',
      };
      
      const owner = users.find(u => u.cardIds.includes(oldCardId));
      if (owner) {
          setUsers(prev => prev.map(u => u.id === owner.id ? { ...u, cardIds: [...u.cardIds.filter(id => id !== oldCardId), newCardId] } : u));
      }
      
      // Fix: Explicitly type the return of the map function to prevent type widening of the 'status' property.
      setCards(prev => [...prev.map((c): Card => c.id === oldCardId ? { ...c, status: 'inactive' } : c), newCard]);
      
      return { success: true, message: `Card ${oldCardId} successfully transferred to ${newCardId}.` };
  };


  const value = {
    products,
    cards,
    transactions,
    users,
    currentUser,
    addProduct,
    deleteProduct,
    issueCard,
    topUpCard,
    getCard,
    processPayment,
    getTransactionsForCard,
    register,
    login,
    logout,
    linkCard,
    requestPasswordReset,
    adminResetPassword,
    updateCardStatus,
    correctCardBalance,
    transferCardData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
