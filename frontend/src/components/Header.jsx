import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { BellIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import api from '../services/api';
import loomioLogo from '../assets/Loomio.png';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    fetchNotifications();
    fetchNotificationCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/notifications?limit=5');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/notifications/count');
      setNotificationCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const handleViewAllNotifications = () => {
    navigate('/app/notifications');
    setShowNotifications(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Logo/Brand - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src={loomioLogo} alt="Loomio" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Loomio
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Community Hub</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-secondary-400 hover:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl hover:bg-white/60 transition-all duration-200 transform hover:scale-105"
              >
                <BellIcon className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full font-semibold">
                        {notificationCount} new
                      </span>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.notification_id}
                          className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              !notification.is_read ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}></div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={handleViewAllNotifications}
                      className="w-full text-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-sm transition-colors duration-200"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 p-2">
                  <span className="sr-only">Open user menu</span>
                  <div className="w-10 h-10 bg-primary-600 dark:bg-primary-700 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user?.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 text-left hidden sm:block">
                    <p className="text-gray-900 dark:text-white font-bold text-sm">{user?.full_name}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs capitalize font-medium">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl py-2 bg-white dark:bg-gray-800 backdrop-blur-lg border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                  </div>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/app/profile"
                        className={`${
                          active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                        } flex items-center px-4 py-3 text-sm font-semibold transition-colors duration-200`}
                      >
                        <UserCircleIcon className="w-5 h-5 mr-3" />
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/app/settings"
                        className={`${
                          active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                        } flex items-center px-4 py-3 text-sm font-semibold transition-colors duration-200`}
                      >
                        <Cog6ToothIcon className="w-5 h-5 mr-3" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                        } flex items-center w-full px-4 py-3 text-sm font-semibold transition-colors duration-200`}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
