import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// This function defines which routes are accessible to everyone, logged in or not.
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/',
  '/api/(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // By default, clerkMiddleware protects all routes.
  // We only need to specify an exception for the public routes.
  if (isPublicRoute(req)) {
    return; // Allow the request to proceed without authentication
  }
  
  // For any route that is not in our isPublicRoute matcher,
  // this will automatically enforce authentication. If the user is
  // not logged in, they will be redirected to the sign-in page.
  auth(); 
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and public assets
    '/((?!.+\\.[\\w]+$|_next).*)',
    // Run on the root and all API routes
    '/', 
    '/(api|trpc)(.*)'
  ],
};