import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

function App() {
    return (
        <Router>
            <div className="container mt-5">
                <Routes>
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/" element={<h2 className="text-center">Welcome to Password Reset App. Go to <a href="/forgot-password">Forgot Password</a></h2>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
