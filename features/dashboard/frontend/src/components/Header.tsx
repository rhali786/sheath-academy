interface HeaderProps {
  onTabChange: (tab: string) => void
  selectedTab: string
}

export function Header({ onTabChange, selectedTab }: HeaderProps) {
  const tabs = ['Today', 'Weekly', 'Reports', 'Settings']

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sheath Home</h1>
            <p className="text-sm text-gray-600">Household: Naeem Family</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Mon, May 4</p>
            <p className="text-xs text-gray-500">17 Dhul Qi'dah, 1447</p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-200 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
