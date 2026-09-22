import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// '/' is the public welcome page (app/page.tsx) — it checks auth() itself
// and redirects a signed-in visitor into /workflows, so it doesn't need
// auth.protect() to gate it here.
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
