export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold">CC</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">CampusConnect</h1>
          <p className="text-xl text-white/90 mb-8">Learn. Connect. Trade.</p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">📚 Notes Hub</p>
              <p className="text-sm text-white/80">Share academic resources</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">🛍️ Marketplace</p>
              <p className="text-sm text-white/80">Buy & sell with classmates</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">👥 Study Groups</p>
              <p className="text-sm text-white/80">Collaborate & learn together</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">💼 Jobs</p>
              <p className="text-sm text-white/80">Find opportunities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
