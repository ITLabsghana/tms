import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import './LoginPage.css'; // We will create this CSS file for background and footer

const LoginPage = () => {
  return (
    <div className="login-page-container-new"> {/* Main full-page container */}
      <div className="background-container-new">
        <div className="top-pattern-new">
          {/* Geometric shapes will be styled by CSS */}
          <div className="geo-shape-new s1-new"></div>
          <div className="geo-shape-new s2-new"></div>
          <div className="geo-shape-new s3-new"></div>
          <div className="geo-shape-new s4-new"></div>
          <div className="geo-shape-new s5-new"></div>
          <div className="geo-shape-new s6-new"></div> {/* New shape */}
          <div className="geo-shape-new s7-new"></div> {/* New shape */}
          <div className="geo-shape-new s8-new"></div> {/* New shape */}
        </div>
        {/* <div className="bottom-solid-new"></div> Removed this element */}
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
