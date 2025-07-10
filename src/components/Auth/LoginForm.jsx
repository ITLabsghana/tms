import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css'; // We will create this CSS file next

const LoginForm = () => {
  const [email, setEmail] = useState(''); // Assuming 'username' from new design is email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Using email for the signIn function as per original logic
      const { error: signInError } = await signIn({ email, password });
      if (signInError) {
        throw signInError;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-form-new"> {/* Renamed class to avoid potential global conflicts */}
      <div className="icon-area-new">
        <div className="icon-shape-new">
          <div className="padlock-graphic-new">
            {/* CSS will handle shackle via ::before */}
          </div>
          <div className="dots-container-on-padlock-new">
            <span className="dot-new"></span>
            <span className="dot-new"></span>
            <span className="dot-new"></span>
            <span className="dot-new"></span>
          </div>
        </div>
      </div>
      <h1 className="main-title-new">Teacher Management System Login</h1>
      {error && <div className="error-message-new">{error}</div>}
      <form onSubmit={handleSubmit} className="form-new">
        <div className="input-group-new">
          <label htmlFor="email">Email Address *</label>
          {/* Label changed to Email Address, but uses 'username' placeholder from new design for consistency with visual */ }
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email Address" // Placeholder updated
            required
          />
        </div>
        <div className="input-group-new">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            required
          />
        </div>
        <button type="submit" className="login-button-new" disabled={loading}>
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
