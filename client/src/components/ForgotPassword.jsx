import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [serverStatus, setServerStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`,
                { email },
                { timeout: 15000 }
            );
            setMessage(response.data.message);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
            setError(errorMsg);
            console.error('Detailed Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkServer = async () => {
        setServerStatus('Checking...');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${apiUrl}/`);
            setServerStatus(`Success: ${response.data}`);
        } catch (err) {
            setServerStatus(`Failed: ${err.message}`);
        }
    };

    return (
        <div className="row justify-content-center mt-5">
            <div className="col-md-6 border p-4 shadow-sm rounded bg-light" style={{ borderTop: '5px solid #0d6efd' }}>
                <h3 className="text-center mb-4">Forgot Password</h3>
                <div className="text-center mb-3">
                    <button type="button" onClick={checkServer} className="btn btn-sm btn-outline-info">
                        Test Server Connection
                    </button>
                    {serverStatus && <div className="small mt-1 text-muted">{serverStatus}</div>}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                {message && <div className="alert alert-success mt-3">{message}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>
        </div>
    );
};

export default ForgotPassword;
