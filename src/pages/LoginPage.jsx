import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import './LoginPage.css'; // For background, footer, and overall page styles

const LoginPage = () => {
  return (
    <div className="login-page-container-new"> {/* Main full-page container */}
      <div className="background-container-new">
        <div className="top-pattern-new"> {/* This will be 100% height with a full gradient */}
          {/* Geometric shapes */}
          <div className="geo-shape-new s1-new"></div>
          <div className="geo-shape-new s2-new"></div>
          <div className="geo-shape-new s3-new"></div>
          <div className="geo-shape-new s4-new"></div>
          <div className="geo-shape-new s5-new"></div>
          <div className="geo-shape-new s6-new"></div>
          <div className="geo-shape-new s7-new"></div>
          <div className="geo-shape-new s8-new"></div>
        </div>
        {/* No .bottom-solid-new element here */}
      </div>

      <div className="login-form-wrapper-new"> {/* Centering the login form */}
        <LoginForm />
      </div>

      <footer className="page-footer-new">
        <p>Designed and Created by ITLabs Ghana. Contact 0248362847</p>
      </footer>
    </div>
  );
};

export default LoginPage;
