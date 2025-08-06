// Temporary file to hold the fixed error handling
const handleErrors = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const errorParam = params.get('error');
    const provider = params.get('provider');

    console.log('🔍 [OAuth Debug] Auth page loaded with params:', { oauth, provider, error: errorParam });

    if (errorParam) {
      let errorMessage = "Failed to authenticate with Google.";
      
      switch (errorParam) {
        case 'google_email_not_verified':
          errorMessage = "Your Google email is not verified. Please verify your email with Google first.";
          break;
        case 'google_oauth_denied':
          errorMessage = "Google authentication was cancelled or denied.";
          break;
        case 'google_token_exchange_failed':
          errorMessage = "Failed to exchange Google authorization code. Please try again.";
          break;
        case 'google_user_info_failed':
          errorMessage = "Failed to retrieve your Google profile information.";
          break;
        case 'oauth_config_missing':
          errorMessage = "Google OAuth is not properly configured. Please contact support.";
          break;
        default:
          errorMessage = `Authentication error: ${errorParam.replace(/_/g, ' ')}`;
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (oauth === 'success' && provider === 'google') {
      setIsLoading(true);
      try {
        const userData = await fetchOAuthUserData();
        
        if (!userData) {
          throw new Error('No user data received');
        }
        
        console.log('✅ [OAuth] User data received:', { ...userData, email: userData.email.substring(0, 3) + '...' });
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        toast({
          title: "Login Successful",
          description: `Welcome ${userData.firstName}! You've been successfully logged in.`,
        });

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to home page
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      } catch (error) {
        console.error('❌ [OAuth] Error:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to process login data. Please try again.",
          variant: "destructive",
        });
      }
    }
  } catch (error) {
    console.error('❌ [OAuth] Error:', error);
    toast({
      title: "Authentication Error",
      description: "An unexpected error occurred during authentication. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
