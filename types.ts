export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Card {
  id: string;
  balance: number;
  status: 'active' | 'inactive';
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id:string;
  cardId: string;
  items: TransactionItem[];
  total: number;
  timestamp: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be a hash
  cardIds: string[];
  role: UserRole;
  email: string;
  passwordResetRequested?: boolean;
}

export interface AppContextType {
  products: Product[];
  cards: Card[];
  transactions: Transaction[];
  users: User[];
  currentUser: User | null;
  addProduct: (name: string, price: number) => void;
  deleteProduct: (productId: string) => void;
  issueCard: (initialBalance: number) => Card;
  topUpCard: (cardId: string, amount: number) => boolean;
  getCard: (cardId: string) => Card | undefined;
  processPayment: (cardId: string, cart: CartItem[]) => { success: boolean; message: string };
  getTransactionsForCard: (cardId: string) => Transaction[];
  register: (username: string, password: string) => { success: boolean; message: string };
  login: (username: string, password: string) => { success: boolean; message: string; user?: User };
  logout: () => void;
  linkCard: (userId: string, cardId: string) => { success: boolean; message: string };
  requestPasswordReset: (username: string) => { success: boolean; message: string };
  adminResetPassword: (userId: string, newPassword: string) => { success: boolean; message: string };
  updateCardStatus: (cardId: string, status: 'active' | 'inactive') => boolean;
  correctCardBalance: (cardId: string, amount: number, reason: string) => { success: boolean, message: string };
  transferCardData: (oldCardId: string, newCardId: string) => { success: boolean, message: string };
}