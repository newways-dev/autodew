import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WorkflowIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

// The public entry point at '/'. A signed-in visitor has no reason to see a
// pitch for the product they're already using, so this redirects straight
// into the app; proxy.ts marks '/' as a public route precisely so this check
// — not auth.protect() — is what decides who sees which.
export default async function WelcomePage() {
  const { userId } = await auth()
  if (userId) redirect('/workflows')

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-neutral-950 text-white">
      {/* public/images/background.jpg: a dark wireframe node graph. Slightly
          dimmed overall (opacity-80) plus a stronger gradient toward the
          bottom, where the text sits. */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url('/images/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
      {/* A radial vignette centered on the text, so the title/description sit
          on the darkest part of the image without dimming the corners. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 30%, transparent 65%)',
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <header className="flex items-center gap-2 px-6 py-6 sm:px-10">
          <WorkflowIcon className="size-5" />
          <span className="text-sm font-medium tracking-tight">Autodew</span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Automate the web, visually.
          </h1>
          <p className="mt-4 max-w-md text-balance text-neutral-300">
            Chain browser actions and AI agents on a shared canvas, run them
            in the background or on a schedule, and watch every step live.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-neutral-950 hover:bg-white/90">
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
