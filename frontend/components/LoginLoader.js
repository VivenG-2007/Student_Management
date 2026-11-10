'use client';

/**
 * LoginLoader — Full-screen animated splash shown after successful login,
 * before navigating to the dashboard.
 * Designed with pure pitch black background for dark mode, sleek white accents.
 */
export default function LoginLoader({ role }) {
  const isAdmin = role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-950 via-black to-black text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Animated Brand Badge */}
      <div className="relative mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-2xl animate-bounce">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        {/* Orbiting ring */}
        <div className="absolute -inset-1 sm:-inset-1.5 rounded-3xl border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" style={{ animationDuration: '1.4s' }} />
      </div>

      {/* Heading & Subtitle */}
      <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight text-center">
        {isAdmin ? 'Loading Administrator Dashboard' : 'Setting Up Your Student Portal'}
      </h2>
      <p className="text-zinc-400 text-xs sm:text-sm mb-6 sm:mb-8 text-center max-w-xs sm:max-w-sm px-2">
        {isAdmin
          ? 'Syncing student database and class attendance registers...'
          : 'Retrieving your latest attendance metrics and course history...'}
      </p>

      {/* Progress bar */}
      <div className="w-60 sm:w-72 h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-6 border border-zinc-700/50">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-progress-bar" />
      </div>

      {/* Checklist items */}
      <div className="flex flex-col items-start space-y-2 text-zinc-400 text-xs sm:text-sm">
        {[
          { text: 'Verifying session token', delay: '0ms' },
          { text: 'Loading role permissions', delay: '400ms' },
          { text: isAdmin ? 'Connecting to student database' : 'Calculating attendance percentages', delay: '800ms' },
        ].map((step, i) => (
          <div
            key={i}
            className="flex items-center space-x-2.5 opacity-0 animate-fade-in"
            style={{ animationDelay: step.delay, animationFillMode: 'forwards' }}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
