import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Card from '../shared/Card';
import { LoginIcon, KeyIcon } from '../icons';
import { Panel } from '../../App';
import { UserRole } from '../../types';

interface AuthPanelProps {
    setActivePanel: (panel: Panel) => void;
}

type AuthView = 'login' | 'register' | 'forgot';

const AuthPanel: React.FC<AuthPanelProps> = ({ setActivePanel }) => {
    const { login, register, requestPasswordReset } = useAppContext();
    const [view, setView] = useState<AuthView>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSwitchView = (newView: AuthView) => {
        setView(newView);
        setMessage({ type: '', text: '' });
        setUsername('');
        setPassword('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (view === 'login') {
            const result = login(username, password);
            if (result.success && result.user) {
                if (result.user.role === UserRole.USER) {
                    setActivePanel('user');
                } else {
                    setActivePanel('admin');
                }
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } else if (view === 'register') {
            const result = register(username, password);
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setTimeout(() => handleSwitchView('login'), 2000);
            }
        } else if (view === 'forgot') {
            const result = requestPasswordReset(username);
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        }
    };
    
    const renderTitle = () => {
        if(view === 'login') return "Login";
        if(view === 'register') return "Register";
        return "Forgot Password";
    }
    
    const renderIcon = () => {
        if(view === 'forgot') return <KeyIcon className="w-6 h-6 text-teal-400"/>;
        return <LoginIcon className="w-6 h-6 text-teal-400"/>;
    }

    return (
        <div className="max-w-md mx-auto">
            <Card title={renderTitle()} icon={renderIcon()}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    {view !== 'forgot' && (
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    )}
                    <Button type="submit" fullWidth>
                        {view === 'login' && 'Login'}
                        {view === 'register' && 'Create Account'}
                        {view === 'forgot' && 'Request Reset'}
                    </Button>
                </form>

                {message.text && (
                    <p className={`text-center text-sm mt-4 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </p>
                )}

                <div className="mt-4 text-center text-sm space-y-2">
                    {view === 'login' && (
                        <>
                            <button onClick={() => handleSwitchView('register')} className="text-teal-400 hover:underline">
                                Don't have an account? Register
                            </button>
                            <span className="text-gray-500 mx-2">|</span>
                            <button onClick={() => handleSwitchView('forgot')} className="text-teal-400 hover:underline">
                                Forgot Password?
                            </button>
                        </>
                    )}
                    {view === 'register' && (
                        <button onClick={() => handleSwitchView('login')} className="text-teal-400 hover:underline">
                           Already have an account? Login
                        </button>
                    )}
                     {view === 'forgot' && (
                        <button onClick={() => handleSwitchView('login')} className="text-teal-400 hover:underline">
                           Back to Login
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AuthPanel;