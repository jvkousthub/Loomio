import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  ChartBarIcon, 
  BellIcon,
  SparklesIcon,
  TrophyIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PlusCircleIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import loomioLogo from '../assets/Loomio.png';

const Home = () => {
  const { isDark, toggleTheme } = useTheme();
  const features = [
    {
      icon: UserGroupIcon,
      title: 'Community Collaboration',
      description: 'Build and manage vibrant communities with seamless member management and real-time communication.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Task Management',
      description: 'Create, assign, and track tasks efficiently with both individual and group task support.'
    },
    {
      icon: TrophyIcon,
      title: 'Contribution Assessment',
      description: 'Track and recognize individual contributions with transparent performance metrics and achievements.'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Gain insights with comprehensive analytics and statistics to track progress and productivity.'
    },
    {
      icon: CalendarIcon,
      title: 'Event Scheduling',
      description: 'Organize events, track attendance, and keep your community engaged with an integrated calendar.'
    },
    {
      icon: BellIcon,
      title: 'Smart Notifications',
      description: 'Stay updated with intelligent notifications for tasks, comments, deadlines, and community activities.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src={loomioLogo} alt="Loomio" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Loomio
              </span>
            </div>

            {/* Auth Buttons & Theme Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <SunIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
              
              <Link
                to="/login"
                className="px-3 py-2 sm:px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 sm:px-6 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary-500/40 transform hover:-translate-y-0.5"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-20 sm:pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 dark:bg-primary-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-200 dark:bg-accent-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100 dark:bg-primary-800/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 text-primary-700 dark:text-primary-300 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 animate-fade-in border border-primary-200/50 dark:border-primary-800/50 shadow-lg backdrop-blur-sm">
            <span className="hidden sm:inline">Threads of Effort, Woven Into Outcomes</span>
            <span className="sm:hidden">Effort Into Outcomes</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 animate-slide-in px-4 leading-tight">
            <span className="block sm:inline">Community-Based</span>
            <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-accent-600 dark:from-primary-400 dark:via-primary-300 dark:to-accent-400 bg-clip-text text-transparent mt-2 sm:mt-0 sm:ml-3">
              Task Management
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 animate-fade-in px-4 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            A collaborative platform for managing tasks, assessing contributions, 
            and building stronger communities through transparent productivity tracking.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 px-4 mb-12 sm:mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link
              to="/register"
              className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-primary-600 via-primary-500 to-accent-600 rounded-2xl shadow-2xl shadow-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-600/60 transform hover:-translate-y-2 hover:scale-105 flex items-center justify-center space-x-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Get Started Free</span>
              <svg className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-primary-700 dark:text-primary-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-primary-300 dark:border-primary-700 rounded-2xl hover:bg-primary-50 dark:hover:bg-gray-700 hover:border-primary-400 dark:hover:border-primary-600 shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105"
            >
              Sign In to Your Account
            </Link>
          </div>

          {/* Visual Enhancement - Floating Cards */}
          <div className="relative max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-3 mx-auto">
                  <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">Task Tracking</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Seamless workflow</p>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl mb-3 mx-auto">
                  <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">Analytics</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Deep insights</p>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-2 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl mb-3 mx-auto">
                  <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">Recognition</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Fair assessment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Powerful features designed to help your community thrive and achieve more together
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-3 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 dark:from-primary-500/10 dark:to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex p-4 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Guide Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Getting Started</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Your Journey with Loomio
            </h2>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Whether you're a member or an admin, follow these simple steps to get the most out of Loomio
            </p>
          </div>

          {/* Toggle between User and Admin Guide */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 shadow-lg">
              <button 
                onClick={(e) => {
                  document.getElementById('user-guide').classList.remove('hidden');
                  document.getElementById('admin-guide').classList.add('hidden');
                  e.currentTarget.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-md');
                  e.currentTarget.classList.remove('text-gray-600', 'dark:text-gray-400');
                  document.getElementById('admin-btn').classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-md');
                  document.getElementById('admin-btn').classList.add('text-gray-600', 'dark:text-gray-400');
                }}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white"
              >
                <UserIcon className="h-5 w-5" />
                <span>For Members</span>
              </button>
              <button 
                id="admin-btn"
                onClick={(e) => {
                  document.getElementById('admin-guide').classList.remove('hidden');
                  document.getElementById('user-guide').classList.add('hidden');
                  e.currentTarget.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-md');
                  e.currentTarget.classList.remove('text-gray-600', 'dark:text-gray-400');
                  document.querySelectorAll('button')[document.querySelectorAll('button').length - 2].classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-md');
                  document.querySelectorAll('button')[document.querySelectorAll('button').length - 2].classList.add('text-gray-600', 'dark:text-gray-400');
                }}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-gray-600 dark:text-gray-400"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                <span>For Admins</span>
              </button>
            </div>
          </div>

          {/* User Guide */}
          <div id="user-guide" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="group relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary-200 dark:border-primary-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UserIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Your Account</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Sign up with your email and complete your profile. Add a profile picture and bio to help your community recognize you.
                  </p>
                  <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-semibold">
                    <span>Takes 2 minutes</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative bg-gradient-to-br from-accent-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-accent-200 dark:border-accent-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-accent-100 to-primary-100 dark:from-accent-900/50 dark:to-primary-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="h-8 w-8 text-accent-600 dark:text-accent-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Join a Community</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Browse available communities or wait for an invitation. Join communities that align with your interests and goals.
                  </p>
                  <div className="flex items-center text-sm text-accent-600 dark:text-accent-400 font-semibold">
                    <span>Instant access</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary-200 dark:border-primary-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <EyeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">View Assigned Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Check your dashboard for tasks assigned to you. Filter by status, priority, and deadline to stay organized.
                  </p>
                  <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-semibold">
                    <span>Real-time updates</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group relative bg-gradient-to-br from-accent-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-accent-200 dark:border-accent-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  4
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-accent-100 to-primary-100 dark:from-accent-900/50 dark:to-primary-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircleIcon className="h-8 w-8 text-accent-600 dark:text-accent-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Accept & Complete Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Accept group tasks, update progress, and submit completed work. Add comments to keep everyone informed.
                  </p>
                  <div className="flex items-center text-sm text-accent-600 dark:text-accent-400 font-semibold">
                    <span>Track progress</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="group relative bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary-200 dark:border-primary-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  5
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrophyIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Earn Points & Rank Up</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Complete tasks to earn points and climb the leaderboard. View your statistics and celebrate your achievements.
                  </p>
                  <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-semibold">
                    <span>Build your reputation</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Guide */}
          <div id="admin-guide" className="hidden space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Admin Step 1 */}
              <div className="group relative bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-purple-200 dark:border-purple-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <PlusCircleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Your Community</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Set up your community with a name, description, and guidelines. Customize settings to match your community's needs.
                  </p>
                  <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                    <span>Quick setup</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Admin Step 2 */}
              <div className="group relative bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-indigo-200 dark:border-indigo-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Invite Members</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Send invitations via email or share your community link. Review and approve join requests from interested members.
                  </p>
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>Grow your team</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Admin Step 3 */}
              <div className="group relative bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-purple-200 dark:border-purple-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Create Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Create individual or group tasks with clear descriptions, deadlines, and point values. Assign tasks strategically.
                  </p>
                  <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                    <span>Define work clearly</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Admin Step 4 */}
              <div className="group relative bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-indigo-200 dark:border-indigo-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  4
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Review Submissions</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Review completed tasks, provide feedback, and approve or request revisions. Ensure quality standards are met.
                  </p>
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>Maintain quality</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>

              {/* Admin Step 5 */}
              <div className="group relative bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-purple-200 dark:border-purple-800 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  5
                </div>
                <div className="mt-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Monitor Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    Track community performance, member contributions, and task completion rates. Use data to make informed decisions.
                  </p>
                  <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                    <span>Data-driven insights</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 dark:from-primary-800 dark:via-primary-900 dark:to-accent-800 overflow-hidden transition-colors duration-300">
        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-soft-light opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full mix-blend-soft-light opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-accent-300 rounded-full mix-blend-soft-light opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Ready to Transform Your Community?
          </h2>
          <p className="text-base sm:text-xl text-primary-100 dark:text-primary-200 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Start managing tasks and assessing contributions with transparency and efficiency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/register"
              className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold text-primary-700 bg-white rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-2xl hover:scale-110 flex items-center justify-center space-x-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Create Free Account</span>
              <svg className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold text-white border-2 border-white/40 rounded-2xl hover:bg-white/20 hover:border-white backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-xl"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 dark:text-gray-500 py-8 sm:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src={loomioLogo} alt="Loomio" className="h-8 w-8 object-contain" />
              <span className="text-lg sm:text-xl font-bold text-white">Loomio</span>
            </div>
            <div className="text-xs sm:text-sm text-center md:text-left">
              © 2025 Loomio. Threads of effort, woven into outcomes.
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6 text-sm">
              <Link to="/login" className="hover:text-white dark:hover:text-gray-200 transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white dark:hover:text-gray-200 transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
