/**
 * Google OAuth Service
 * Handles Google authentication responses and token validation
 */

export const handleGoogleLogin = async (credentialResponse) => {
  try {
    const token = credentialResponse.credential;
    
    // Decode JWT to get user info (without verification - for frontend demo)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const userData = JSON.parse(jsonPayload);
    
    // Store token and user info
    localStorage.setItem('googleToken', token);
    localStorage.setItem('user', JSON.stringify({
      id: userData.sub,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      provider: 'google'
    }));
    
    console.log('Google Login Success:', userData);
    
    return {
      success: true,
      user: userData,
      token: token
    };
  } catch (error) {
    console.error('Error processing Google login:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const handleGoogleSignup = async (credentialResponse, accountType) => {
  try {
    const token = credentialResponse.credential;
    
    // Decode JWT to get user info
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const userData = JSON.parse(jsonPayload);
    
    // Store token, user info, and account type
    localStorage.setItem('googleToken', token);
    localStorage.setItem('user', JSON.stringify({
      id: userData.sub,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      accountType: accountType,
      provider: 'google'
    }));
    
    console.log('Google Signup Success:', userData);
    
    return {
      success: true,
      user: {
        ...userData,
        accountType: accountType
      },
      token: token
    };
  } catch (error) {
    console.error('Error processing Google signup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const isUserLoggedIn = () => {
  const token = localStorage.getItem('googleToken');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export const getStoredUser = () => {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
};

export const logout = () => {
  localStorage.removeItem('googleToken');
  localStorage.removeItem('user');
};
