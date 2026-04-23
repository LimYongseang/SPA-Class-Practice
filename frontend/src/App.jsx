import React, { useState, useEffect } from 'react';
import './App.css'; // Add some basic styling here later

function App() {
  // State for CSRF token
  const [csrfToken, setCsrfToken] = useState('');

  // State for Login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State for Contacts
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // TASK 1: useEffect -> fetch /api/csrf-token, store in state
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // TASK 3 (Bonus): credentials: 'include' ensures the session cookie is sent/received
        const response = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'include', 
        });
        
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } else {
          console.error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // TASK 4: Wire up the login form
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Depending on how strict the backend csurf setup is, 
          // you may also need the CSRF header on the login route.
          'x-csrf-token': csrfToken 
        },
        credentials: 'include', // Crucial for receiving the session cookie
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        alert('Login successful!');
      } else {
        alert('Login failed. Check credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // TASK 2: Update handleSubmit to include x-csrf-token header
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken // Supplying the token grabbed from useEffect
        },
        credentials: 'include', // Crucial for proving the user is logged in
        body: JSON.stringify({ name: contactName, message: contactMessage }),
      });

      if (response.ok) {
        alert('Contact added successfully!');
        setContactName('');
        setContactMessage('');
      } else if (response.status === 403) {
        alert('CSRF validation failed! (403)');
      } else if (response.status === 401) {
        alert('Unauthorized. Please log in.');
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1>SPA Practice</h1>
      
      {/* Show if CSRF is loaded for debugging */}
      <p style={{ fontSize: '12px', color: 'gray' }}>
        CSRF Token Status: {csrfToken ? 'Loaded ✓' : 'Loading...'}
      </p>

      {!isLoggedIn ? (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <h2>Login</h2>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Log In</button>
        </form>
      ) : (
        <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>Add Contact</h2>
          <input 
            type="text" 
            placeholder="Contact Name" 
            value={contactName} 
            onChange={(e) => setContactName(e.target.value)} 
            required 
          />
          <textarea 
            placeholder="Message" 
            value={contactMessage} 
            onChange={(e) => setContactMessage(e.target.value)} 
            required 
          />
          <button type="submit">Submit Contact</button>
        </form>
      )}
    </div>
  );
}

export default App;