interface HeaderProps {
  onTabChange: (tab: string) => void
  selectedTab: string
}

export function Header({ onTabChange, selectedTab }: HeaderProps) {
  const tabs = ['Today', 'Weekly', 'Reports', 'Settings']

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {/* Islamic star brand mark — ش (shin) in a green circle */}
            <div className="w-9 h-9 rounded-xl bg-forest-900 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-base font-bold leading-none" aria-hidden="true">ش</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">Sheath Academy</h1>
              <p className="text-xs text-slate-400">Naeem Family · Home Education</p>
            </div>
          </div>

          {/* Hijri date — featured, not an afterthought */}
          <div className="text-right">
            <div className="text-base font-bold text-forest-900 leading-tight" lang="ar" dir="rtl">
              ١٧ ذو القعدة
            </div>
            <div className="text-xs text-slate-400 mt-0.5">1447 AH · Sun, 10 May 2026</div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0.5 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                selectedTab === tab
                  ? 'bg-forest-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
