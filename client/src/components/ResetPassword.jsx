import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import { FaLock } from 'react-icons/fa';

function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            try {
                await axios.get(`${API_URL}/api/auth/verify-token/${token}`);
                setIsTokenValid(true);
            } catch (err) {
                setError('Invalid or expired password reset link.');
                setIsTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    if (verifying) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Verifying link...</span>
                </div>
            </div>
        );
    }

    if (!isTokenValid) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center" role="alert">
                    <h4 className="alert-heading">Invalid Link</h4>
                    <p>{error}</p>
                    <hr />
                    <p className="mb-0">Please request a new password reset link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow border-0">
                    <div className="card-body p-5">
                        <h2 className="text-center mb-4">Reset Password</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">New Password</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaLock /></span>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="Enter new password"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Reset Password</button>
                        </form>
                        {message && <div className="alert alert-success mt-3">{message}</div>}
                        {error && <div className="alert alert-danger mt-3">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
