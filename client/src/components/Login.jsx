import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            setMessage(response.data.message);
            // In a real app, store token in localStorage
            // localStorage.setItem('token', response.data.token);
            // navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow border-0">
                    <div className="card-body p-5">
                        <h2 className="text-center mb-4">Login</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Email address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Login</button>
                        </form>
                        {message && <div className="alert alert-success mt-3">{message}</div>}
                        {error && <div className="alert alert-danger mt-3">{error}</div>}
                        <div className="mt-3 text-center">
                            Don't have an account? <Link to="/register">Register</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
