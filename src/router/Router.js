import {Router} from '@vaadin/router';
import { isAuthenticated } from '../store/index.js';

/**
 * Client-side Router configuration for FileFlow APP
 * 
 * This router handles:
 * - URL-based navigation without page refreshes
 * - Lazy loading of page components (better performance)
 * - Authentication guards (protecting private pages)
 * - Automatic redirects based on auth state
 */

/**
 * =====================================================
 * ROUTE DEFINITIONS
 * =====================================================
 * 
 */

/**
 * Define all the routes (URL patterns) and their corresponding page components
 * 
 * Each route object has:
 * - path: The URL pattern to match
 * - component: Which page component to load
 * - action: Optional function to run before showing the page (for auth checks)
 */
const routes = [
    /**
     * ========================================
     * PUBLIC ROUTES - Anyone can access these
     * ========================================
     */

    {
        path: '/',
        component: 'landing-page',
        action: () => {
            // if user is already logged in, redirect to dashboard
            if(isAuthenticated()){
                console.log('User already authenticated, redirecting to dashboard');
                Router.go('/dashboard');
                return;
            }
            // Otherwise, import and show Landing page
            return import('../pages/LandingPage.js');
        }
    },

    {
        path: '/login',
        component: 'login-page',
        action: () =>{
            // If user is already logged in, redirect to dashboard
            if(isAuthenticated()){
                console.log('User already Authenticated, redirecting to dashboard');
                Router.go('/dashboard');
                return;
            }
            // Otherwise, import and show login page
            return import('../pages/Loginpage.js');
        }
    },

    {
        path: '/register',
        component: 'register-page',
        action: () => {
            // If user is already logged in, redirect to dashboard
            if(isAuthenticated()){
                console.log('User already authenticated, redirecting to dashboard');
                Router.go('/dashboard');
                return;
            }
            // Otherwise, import and show registration page
            return import('../pages/RegisterPage.js');
        }
    },

    /**
     * =================================================
     * PROTECTED ROUTES - Need authentication
     * =================================================
     */

    {
        path: '/dashboard',
        component: 'dashboard-page',
        action: async () => {
            // Check if user is Authenticated
            if(!isAuthenticated()){
                console.log('Access denied - not Authenticated. Redirecting to login');
                Router.go('/login');
                return;
            }
            console.log('Loading dashboard for authenticated user');
            return import('../pages/Dashboard.js');
        }
    },

    {
        path: '/my-files',
        component: 'my-files-page',
        action: async ()=> {
            if(!isAuthenticated()){
                console.log('Access denied - not authenticated. Redirecting to login');
                Router.go('/login');
                return;
            }
            return import('../pages/MyFiles.js');
        }
    },

    {
        path: '/upload',
        component: 'upload-page',
        action: async ()=>{
            if(!isAuthenticated()){
                console.log('Access denied - not authenticated. Redirecting to login');
                Router.go('/login');
                return;
            }
            return import('../pages/UploadPage.js');
        }
    },

    {
        path: '/profile',
        component: 'profile-page',
        action: async () =>{
            if(!isAuthenticated()){
                console.log('Access denied - not authenticated. Redirecting to login');
                Router.go('/login');
                return;
            }
            return import('../pages/ProfilePage.js');
        }
    },

    /**
     * ===========================================
     * FALLBACK ROUTE - Handle unknown URLs
     * ===========================================
     */


    {
        path: '(.*)', // This matches any path not matched above
        component: 'not-found',
        action: () => {
            console.log('Route not found, displaying 404 page');
            return import('../pages/NotFound.js');
        }
    }
    
];

/**
 * =================================
 * ROUTER INSTANCE AND SETUP
 * =================================
 */

let router = null;


/**
 * Initialize the router
 * 
 * This sets up the router to start listening to URL changes and handling navigation
 * 
 * @param {HTMLElement} outlet - The HTML element where pages will be displayed
 */
function initializeRouter(outlet){

    if(!outlet){
        throw new Error("Router outlet element is required");
    }

    console.log('Initializing router...');

    // create router instance
    router = new Router(outlet);

    // Set up the routes
    router.setRoutes(routes);

    console.log('Router initialized with', routes.length, 'routes');

    // Set up global navigation listeners
    setUpNavigationListeners();
}

/**
 * Set up event listeners for navigation
 * 
 * This handles cases where we need to navigate programatically
 * or respond to authentication state changes
 */
function setUpNavigationListeners(){
    // Listen for authentication state changes
    // If user logs out, redirect to home
    window.addEventListener('user-logout', () =>{
        console.log('User logged out, redirecting to home');
        navigateTo('/');
    });

    // Listen for successful login
    window.addEventListener('user-login', () => {
        console.log('User logged in, redirecting to dashboard');
        navigateTo('/dashboard');
    });
}

/**
 * =================================
 * NAVIGATION HELPERS
 * =================================
 */


/**
 * Navigate to a specific route programatically
 * 
 * Use this in your components to navigate between pages
 * 
 * @param {string} path - The path to navigate to
 * @param {{}} [options={}] - Optional navigation options
 */
function navigateTo(path, options = {}){
    if(!router){
        console.error('Router not initialized. Call initializeRouter() first');
        return;
    }

    console.log('Navigating to:', path);
    Router.go(path);
}

/**
 * Get the current route information
 * 
 * @returns {Object} Current route details
 */
function getCurrentRoute(){
    if(!router){
        return null;
    }

    return {
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        fullUrl: window.location.href
    };
}

/**
 * Check if a specific route is currently active
 * 
 * Useful for highlighting navigation links
 * 
 * @param {String} path - Path to check
 * @returns {boolean} True if the path is currently active
 */
function isRouteActive(path){
    const currentPath = window.location.pathname;

    // Exact match
    if(currentPath === path){
        return true;
    }

    // For dashboard routes, check if current path starts with the path
    if(path !== '/' && currentPath.startsWith(path)){
        return true;
    }
    return false;
}

/**
 * ==================================================
 * ROUTE GUARDS - Authentication checking functions
 * ==================================================
 * 
 */

function requiresAuth(path){
    const protectedRoutes = ['/dashboard', '/my-files', '/upload', '/profile'];
    return protectedRoutes.some(route => path.startsWith(route));
}

/**
 * Check if current route requires authentication
 * 
 * @param {string} Path - Path to check
 * @returns {boolean} True if route is public
 */
function isPublicRoute(Path){
    const publicRoutes = ['/', '/login', '/register'];
    return publicRoutes.includes(path);
}

/**
 * Handles authentication redirects
 * 
 * This function decides where to redirect users based on their auth state
 * and the route they're trying to access
 */
function handleAuthRedirect(){
    const currentPath = window.location.pathname;
    const userIsAuthenticated = isAuthenticated();

    console.log('Checking auth redirect:', { currentPath, userIsAuthenticated});

    if (!userIsAuthenticated && requiresAuth(currentPath)){
        // User is not logged in but trying  to access protected route
        console.log('Redirecting unauthenticated user to login');
        navigateTo('/login');
        return true;
    }
    return false; // No redirection needed
}

/**
 * ==========================================
 * UTILITY FUNCTIONS
 * ===========================================
 */

/**
 * Refresh the current route
 * 
 * useful when you need to re-run route guards or reload the current page
 */
function refreshCurrentRoute(){
    const currentPath = window.location.pathname;
    navigateTo(currentPath);
}


/**
 * Go back to previous page
 * 
 * Uses browser's history API
 */
function goBack(){
    if(window.history.length > 1){
        window.history.back();
    } else{
        // Fallback if no history
        navigateTo('/');
    }
}

/**
 * replace current URL without adding to history
 * 
 * Useful for redirects where you don't want user to go back
 * 
 * 
 */
function replaceTo(path){
    console.log('Replacing current route with:', path);
    window.history.replaceState({}, '', path);
    refreshCurrentRoute();
}


export {
    // core router functions
    initializeRouter,
    navigateTo,

    // Route info
    getCurrentRoute,
    isRouteActive,

    // Authentication helpers
    requiresAuth,
    isPublicRoute,
    handleAuthRedirect,

    // Utility functions
    refreshCurrentRoute,
    goBack,
    replaceTo
};