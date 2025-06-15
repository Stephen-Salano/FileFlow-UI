/**
 * Simple state management Store for FileFlow App
 * 
 * This store handles:
 * - User authentication state (logged in/out)
 * - JWT tokens (access_token, refresh_token)
 * - User profile infomation
 * - Loading states for better UX
 */

/**
 * ====================================
 * INITIAL STATE - What the app starts with
 * ====================================
 */

let state = {
    // Authentication state
    isAuthenticated: false, // is the user logged in
    user: null, // User profile data

    // Tokens for API authentication
    accessToken: null, // our short-lived token for API calls
    refreshToken: null, // Long-lived token to get new access tokens

    // UI states
    isLoading: false,
    error: null
};


/**
 * =====================================
 * LISTENERS - Function that want 
 * =====================================
 */

// Array to store functions that should run when state changes
let listeners = [];

/**
 * Subscribe to state changes
 * 
 * Think of this like "hey, tell me when something important happens"
 * 
 * @param {Function} listener - Function to call when state changes
 * @returns {Function} - Unsubscribe function
 */
function subscribe(listener){
    listeners.push(listener);

    // return a function to unsubscribe 
    return () =>{
        listeners = listeners.filter(l => l !== listener);
    };
}

/**
 * Notify all listeners that state has changed
 * 
 * This tells all parts of the app "hey, something changed, you might want to update"
 */
function notifyListeners(){
    listeners.forEach(listener =>{
        try{
            listener(state); // Call the listeners current state
        } catch (error){
            console.error('Error in state listener:', error);
        }
    });
}

/**
 * ===========================================
 * STATE GETTERS - Ways to read current state
 * ===========================================
 */

/**
 * Get current state (read-only copy)
 * 
 * We return a copy so external code can't accidentally modify our state directly
 */
function getState(){
    return { ...state}; // Spread operator creates a shallow copy
}

/**
 * Check if user is currently authenticated
 * 
 */
function isAuthenticated(){
    return state.isAuthenticated && state.accessToken !== null;
}

/**
 * Get current user information
 */
function getCurrentUser(){
    return state.user;
}

/**
 * Get access token for API calls
 */
function getAccessToken(){
    return state.accessToken;
}

/**
 * ======================================
 * STATE SETTERS - Ways to update state
 * ======================================
 */


/**
 * Use this to show/hide loading spinners
 * @param {boolean} loading  - True if loading, false if done
 */
function setLoading(loading){
    state = { ...state, isLoading: loading};
    notifyListeners();
}


/**
 * Set error message
 * 
 * @param {string/null} error Error message or null to clear error
 */
function setError(error){
    state = {...state, error};
    notifyListeners();
}

/**
 * Login user - save authentication information:
 * 
 * @param {Object} userData - User information from backend
 * @param {String} accessToken - JWT token for API calls
 * @param {String} refreshToken - Token to get new access tokens
 */
function loginUser(userData, accessToken, refreshToken){
    // Update our in-memory state
    state ={
        ...state,
        isAuthenticated: true,
        user: userData, accessToken, refreshToken,
        error: null // clear any previous errors
    };

    // Save to localStorage so user stays logged in after page refresh
    saveToLocalStorage();

    // Tell everyone that logout happened
    notifyListeners();

    console.log('User logged in');
}

/**
 * Logout user - clear all authentication information
 */
function logoutUser(){
    // Clear in-memory state
    state ={
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null
    };
    // Clear local storage
    clearLocalStorage();

    // Tell everyone that logout happened
    notifyListeners();
    console.log('User logged out');
}


/**
 * Update user profile information
 * 
 * @param {Object} userData - updated user information
 */
function updateUser(userData){
    if(!state.isAuthenticated){
        console.warn('Cannot update user - not authenticated');
        return;
    }

    state ={
        ...state,
        user: { ...state.user, ...userData } // Merge with existing user data
    };

    // update localStorage
    saveToLocalStorage();
    notifyListeners();
}

/**
 * ==================================================
 * PERSISTENCE - Remember things after page refresh
 * ==================================================
 */


// Keys for localStorage
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    IS_AUTHENTICATED: 'is_authenticated'
};

/**
 * Save authentication state to localStorage
 * 
 * This makes sure user stays logged in even after closing/refreshing browser
 * 
 */
function saveToLocalStorage(){
    try{
        if(state.accessToken){
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, state.accessToken);
        }

        if(state.refreshToken){
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, state.refreshToken);
        }

        if(state.user){
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(state.user));
        }

        localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, state.isAuthenticated.toString());
    } catch (error){
        console.error('Failed to save to localStorage:', error);
    }
}

/**
 * Load authentication state from localStorage
 * 
 * This runs when the app starts to check if user was previously logged in
 */
function loadFromLocalStorage(){
    try{
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userDataString = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';

        // Only restore state if we have essential pieces
        if(accessToken && isAuthenticated && userDataString){
            state ={
                ...state,
                accessToken, refreshToken,
                user: JSON.parse(userDataString),
                isAuthenticated: true
            };
            console.log('Authentication state restored from localStorage');
        }
    } catch(error){
        console.error('Failed to load from localStorage:', error);
        // if there's an error, clear potentially corrupted data
        clearLocalStorage();
    }
}

/**
 * Clear all authentication data from localStorage
 */
function clearLocalStorage(){
    try{
        Object.values(STORAGE_KEYS).forEach(key =>{
            localStorage.removeItem(key);
        });
    }catch (error){
        console.error('Failed to clear localStorage:', error);
    }
}

/**
 * ===================================================
 * INITIALIZATION - Set up the store when app starts
 * ===================================================
 */

/**
 * Initialize the store
 * 
 * this should be called when the app starts up
 */
function initializeStore(){
    console.log('Initializing state store...');

    //Try to restore authentication state from localStorage
    loadFromLocalStorage();

    console.log('Store initialized. Authenticated:', state.isAuthenticated);
}

/**
 * =======================================================
 * EXPORTS - make functions available to other files
 * =======================================================
 */

export {
    // state readers
    getState,
    isAuthenticated,
    getCurrentUser,
    getAccessToken,

    // state updaters
    setLoading,
    setError,
    loginUser,
    logoutUser,
    updateUser,

    // subscription system
    subscribe,

    // initilization 
    initializeStore
};