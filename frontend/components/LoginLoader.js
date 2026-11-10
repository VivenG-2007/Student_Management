'use client';

/**
 * LoginLoader — Full-screen animated splash shown after successful login,
 * before navigating to the dashboard.
 */
export default function LoginLoader({ role }) {
  const isAdmin = role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center shadow-2xl animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        {/* Orbiting ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/30 border-t-white animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>

      {/* Text */}
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
        {isAdmin ? 'Loading Admin Dashboard' : 'Setting Up Your Portal'}
      </h2>
      <p className="text-indigo-200 text-sm mb-8 text-center max-w-xs">
        {isAdmin
          ? 'Loading student directory and attendance data...'
          : 'Fetching your attendance records and profile...'}
      </p>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-white rounded-full animate-progress-bar" />
      </div>

      {/* Steps */}
      <div className="flex flex-col items-start space-y-2 text-indigo-200 text-xs">
        {[
          { text: 'Verifying credentials', delay: '0ms' },
          { text: 'Loading your profile', delay: '400ms' },
          { text: isAdmin ? 'Loading student directory' : 'Fetching attendance records', delay: '800ms' },
        ].map((step, i) => (
          <div
            key={i}
            className="flex items-center space-x-2 opacity-0 animate-fade-in"
            style={{ animationDelay: step.delay, animationFillMode: 'forwards' }}
          >
            <svg className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

