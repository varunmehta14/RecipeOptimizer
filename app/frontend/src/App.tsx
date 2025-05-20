import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Result } from '@/pages/Result'
import { Database } from '@/pages/Database'
import { cn } from '@/lib/utils'

/**
 * Main Application Component
 * 
 * This is the root component that handles routing and provides the main layout structure
 * including the navigation header and footer. It uses React Router to manage navigation
 * between the three main pages: Home, Result, and Database.
 * 
 * The navigation buttons use active state indicators to show the current page,
 * implemented using the current location from React Router.
 */
function App() {
  // Get the current location to determine active navigation links
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 
        Header with Navigation
        Fixed at the top of the screen with a shadow and z-index to ensure it stays above content
      */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and App Title */}
            <Link to="/" className="flex items-center gap-2 group">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Recipe Optimizer <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Transform recipes to meet your dietary goals
              </p>
            </Link>
            
            {/* Main Navigation Links */}
            <nav>
              <ul className="flex items-center space-x-3">
                {/* Home Navigation Button */}
                <li>
                  <Link 
                    to="/" 
                    className={cn(
                      "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                      // Apply different styles based on whether this is the active page
                      location.pathname === "/" 
                        ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Home
                  </Link>
                </li>
                
                {/* Database Navigation Button */}
                <li>
                  <Link 
                    to="/database" 
                    className={cn(
                      "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                      // Apply different styles based on whether this is the active page
                      location.pathname === "/database" 
                        ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    Database
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="container mx-auto py-8 px-4 flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/database" element={<Database />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Recipe Optimizer AI • All rights reserved</p>
        </div>
      </footer>
    </div>
  )
}

export default App 