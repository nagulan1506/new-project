import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function Register() {
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
            const response = await axios.post(`${API_URL}/api/auth/register`, { email, password });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow border-0">
                    <div className="card-body p-5">
                        <h2 className="text-center mb-4">Register</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Email address</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaEnvelope /></span>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaLock /></span>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Create a password"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Register</button>
                        </form>
                        {message && <div className="alert alert-success mt-3">{message}</div>}
                        {error && <div className="alert alert-danger mt-3">{error}</div>}
                        <div className="mt-3 text-center">
                            Already have an account? <Link to="/login">Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
