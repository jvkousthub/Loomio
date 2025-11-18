import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed, assigned_to_me
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    assigned_to: [],
    due_date: '',
    priority: 'medium',
    task_type: 'individual',
    max_assignees: 1
  });
  const [communityMembers, setCommunityMembers] = useState([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showIndividualReviewModal, setShowIndividualReviewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    submission_link: '',
    submission_notes: ''
  });
  const [reviewForm, setReviewForm] = useState({
    action: 'approve',
    review_notes: ''
  });
  const [individualReviewForm, setIndividualReviewForm] = useState({
    action: 'approve',
    review_notes: ''
  });
  const [showAssignUsersModal, setShowAssignUsersModal] = useState(false);
  const [selectedUsersToAssign, setSelectedUsersToAssign] = useState([]);

  useEffect(() => {
  
    if (user?.communities && user.communities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(user.communities[0]);
    }
  }, [user, selectedCommunity]);

  useEffect(() => {

    fetchTasks();
    
    // Fetch community members if user is admin
    if (selectedCommunity) {
      const userCommunityRole = selectedCommunity.UserCommunity?.role;
      if (userCommunityRole === 'community_admin' || user?.role === 'platform_admin') {
        fetchCommunityMembers();
      }
    }
  }, [filter, selectedCommunity]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let url = '/tasks';
      const params = new URLSearchParams();
      
      // Add community filter if available
      if (selectedCommunity?.community_id) {
        params.append('community_id', selectedCommunity.community_id);
      }
      
      if (filter === 'pending') {
        params.append('status', 'pending');
      } else if (filter === 'completed') {
        params.append('status', 'completed');
      } else if (filter === 'assigned_to_me') {
        params.append('assigned_to', user.user_id);
      }
      
      // Add parameters to URL if any exist
      const paramString = params.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
      
      const response = await api.get(url);
      console.log('Fetched tasks:', response.data.tasks); // Debug log
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityMembers = async () => {
    try {
      if (!selectedCommunity?.community_id) return;
      
      setIsFetchingMembers(true);
      const response = await api.get(`/communities/${selectedCommunity.community_id}/members`);
      console.log('Fetched community members:', response.data.members); // Debug log
      setCommunityMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch community members:', error);
      setError('Failed to load community members');
    } finally {
      setIsFetchingMembers(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!createForm.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!selectedCommunity?.community_id) {
      setError('Please select a community to create tasks');
      return;
    }

    // Check if user is admin of selected community
    const userCommunityRole = selectedCommunity.UserCommunity?.role;
    if (userCommunityRole !== 'community_admin' && user?.role !== 'platform_admin') {
      setError('Only community administrators can create tasks');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const taskData = {
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        community_id: selectedCommunity.community_id,
        task_type: createForm.task_type,
        max_assignees: createForm.task_type === 'group' ? createForm.max_assignees : 1
      };

      if (createForm.assigned_to && createForm.assigned_to.length > 0) {
        taskData.assignee_ids = createForm.assigned_to.map(id => parseInt(id));
      }

      if (createForm.due_date) {
        taskData.deadline = createForm.due_date;
      }

      const response = await api.post('/tasks', taskData);
      setSuccess(`Task "${response.data.task.title}" created successfully!`);
      setCreateForm({
        title: '',
        description: '',
        assigned_to: [],
        due_date: '',
        priority: 'medium',
        task_type: 'individual',
        max_assignees: 1
      });
      setShowCreateForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Task creation error:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => 
        prev.map(task => 
          task.task_id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
      setError('Failed to update task status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlinePassed = (deadlineString) => {
    if (!deadlineString) return false;
    const deadline = new Date(deadlineString);
    const now = new Date();
    return deadline < now;
  };

  const handleSelfAssign = async (taskId) => {
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${taskId}/self-assign`);
      setSuccess(response.data.message);
      fetchTasks();
    } catch (err) {
      console.error('Self-assign error:', err);
      setError(err.response?.data?.message || 'Failed to self-assign task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/tasks/${taskId}/status`, { status });
      setSuccess(response.data.message);
      setShowTaskDetailModal(false); // Close modal immediately
      setSelectedTask(null); // Clear selected task
      fetchTasks();
    } catch (err) {
      console.error('Update task status error:', err);
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${selectedTask.task_id}/submit`, submissionForm);
      setSuccess(response.data.message);
      setSubmissionForm({ submission_link: '', submission_notes: '' });
      setShowSubmissionModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Submit task error:', err);
      setError(err.response?.data?.message || 'Failed to submit task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewTask = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.post(`/tasks/${selectedTask.task_id}/review`, reviewForm);
      setSuccess(response.data.message);
      setReviewForm({ action: 'approve', review_notes: '' });
      setShowReviewModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Review task error:', err);
      setError(err.response?.data?.message || 'Failed to review task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(`/tasks/${taskId}/delete`);
      setSuccess(response.data.message || 'Task deleted successfully');
      fetchTasks();
    } catch (err) {
      console.error('Delete task error:', err);
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to revoke your assignment from this task?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(`/tasks/${taskId}/revoke`);
      setSuccess(response.data.message || 'Task assignment revoked successfully');
      fetchTasks();
    } catch (err) {
      console.error('Revoke task error:', err);
      setError(err.response?.data?.message || 'Failed to revoke task assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewIndividualAssignment = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await api.post(
        `/tasks/${selectedTask.task_id}/review/${selectedAssignment.user_id}`,
        individualReviewForm
      );
      setSuccess(response.data.message);
      setIndividualReviewForm({ action: 'approve', review_notes: '' });
      setShowIndividualReviewModal(false);
      setSelectedAssignment(null);
      fetchTasks();
    } catch (err) {
      console.error('Review individual assignment error:', err);
      setError(err.response?.data?.message || 'Failed to review assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUsersToTask = async () => {
    if (selectedUsersToAssign.length === 0) {
      setError('Please select at least one user to assign');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await api.post(`/tasks/${selectedTask.task_id}/assign-users`, {
        user_ids: selectedUsersToAssign.map(id => parseInt(id))
      });
      setSuccess(response.data.message);
      setShowAssignUsersModal(false);
      setSelectedUsersToAssign([]);
      fetchTasks();
    } catch (err) {
      console.error('Assign users to task error:', err);
      setError(err.response?.data?.message || 'Failed to assign users to task');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'submitted':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'not_started':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const canCreateTasks = () => {
    if (user?.role === 'platform_admin') return true;
    if (!selectedCommunity) return false;
    return selectedCommunity.UserCommunity?.role === 'community_admin';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Tasks
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage your tasks and achieve your goals
              </p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {canCreateTasks() && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create Task</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
              <div className="hidden sm:flex w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-lg items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">{success}</div>
          </div>
        )}

        {/* Community Selector and Filter Tabs */}
        <div className="space-y-4">
          {/* Community Selector */}
          {user?.communities && user.communities.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
              <label htmlFor="community-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Community
              </label>
              <select
                id="community-select"
                value={selectedCommunity?.community_id || ''}
                onChange={(e) => {
                  const communityId = parseInt(e.target.value);
                  const community = user.communities.find(c => c.community_id === communityId);
                  setSelectedCommunity(community);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a community...</option>
                {user.communities.map((community) => (
                  <option key={community.community_id} value={community.community_id}>
                    {community.name} ({community.UserCommunity?.role === 'community_admin' ? 'Admin' : 'Member'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-1">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Tasks' },
                { key: 'assigned_to_me', label: 'Assigned to Me' },
                { key: 'pending', label: 'Pending' },
                { key: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!user?.communities || user.communities.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-12 text-center">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Communities Found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be part of a community to view and manage tasks.</p>
            <button
              onClick={() => window.location.href = '/communities'}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Join a Community
            </button>
          </div>
        ) : !selectedCommunity ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-12 text-center">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Community</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Please select a community above to view and manage tasks.</p>
          </div>
        ) : (
          /* Tasks List */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {filter === 'all' 
                    ? "No tasks have been created yet."
                    : `No ${filter.replace('_', ' ')} tasks found.`
                  }
                </p>
                {canCreateTasks && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {tasks.map((task) => {
                  const userAssignment = task.assignees?.find(a => a.user_id === user.user_id);
                  const isAssignedToUser = !!userAssignment;
                  const currentAssigneeCount = task.assignees?.length || 0;
                  const isAdmin = selectedCommunity?.UserCommunity?.role === 'community_admin' || user?.role === 'platform_admin';
                  
                  // Get assignment status - check multiple possible paths
                  const assignmentStatus = userAssignment?.TaskAssignment?.status || 
                                          userAssignment?.status || 
                                          (task.task_type === 'individual' ? task.status : null);
                  
                  return (
                    <div 
                      key={task.task_id} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetailModal(true);
                      }}
                    >
                      {/* Header with status icon and badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(task.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.task_type === 'group' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {task.task_type === 'group' ? 'Group' : 'Individual'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {task.title}
                      </h3>

                      {/* Priority and assignee count */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {task.task_type === 'group' 
                            ? `${currentAssigneeCount}/${task.max_assignees || 1}`
                            : currentAssigneeCount > 0 ? '1' : '0'}
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        <span className={isDeadlinePassed(task.deadline) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.deadline)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        {isAssignedToUser && assignmentStatus && !['accepted', 'completed', 'submitted', 'rejected'].includes(assignmentStatus) && (
                          <button
                            onClick={() => handleRevokeTask(task.task_id)}
                            className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="flex-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Task</h3>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                    placeholder="Describe the task..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Task Type
                    </label>
                    <select
                      value={createForm.task_type}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        task_type: e.target.value,
                        max_assignees: e.target.value === 'individual' ? 1 : createForm.max_assignees,
                        assigned_to: e.target.value === 'individual' ? (createForm.assigned_to.slice(0, 1)) : createForm.assigned_to
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="individual">Individual Task</option>
                      <option value="group">Group Task</option>
                    </select>
                  </div>

                  {createForm.task_type === 'group' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Assignees
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={createForm.max_assignees}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setCreateForm({ ...createForm, max_assignees: '' });
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 1) {
                              setCreateForm({ ...createForm, max_assignees: numValue });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value) < 1) {
                            setCreateForm({ ...createForm, max_assignees: 1 });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign To {createForm.task_type === 'group' ? '(Multiple Selection)' : ''}
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                    <div className="mb-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          // checked={createForm.assigned_to.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({ ...createForm, assigned_to: [] });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Leave Unassigned (Allow Self-Assignment)</span>
                      </label>
                    </div>
                    {communityMembers.map((member) => (
                      <div key={member.user_id} className="mb-1">
                        <label className="flex items-center">
                          <input
                            type={createForm.task_type === 'individual' ? 'radio' : 'checkbox'}
                            name={createForm.task_type === 'individual' ? 'assigned_member' : undefined}
                            checked={createForm.assigned_to.includes(member.user_id.toString())}
                            onChange={(e) => {
                              if (createForm.task_type === 'individual') {
                                setCreateForm({ 
                                  ...createForm, 
                                  assigned_to: e.target.checked ? [member.user_id.toString()] : []
                                });
                              } else {
                                const currentAssignees = [...createForm.assigned_to];
                                const memberIdStr = member.user_id.toString();
                                if (e.target.checked) {
                                  if (currentAssignees.length < createForm.max_assignees) {
                                    currentAssignees.push(memberIdStr);
                                  }
                                } else {
                                  const index = currentAssignees.indexOf(memberIdStr);
                                  if (index > -1) {
                                    currentAssignees.splice(index, 1);
                                  }
                                }
                                setCreateForm({ ...createForm, assigned_to: currentAssignees });
                              }
                            }}
                            className="mr-2"
                            disabled={createForm.task_type === 'group' && 
                                     !createForm.assigned_to.includes(member.user_id.toString()) && 
                                     createForm.assigned_to.length >= createForm.max_assignees}
                          />
                          <span className="text-sm">{member.full_name}</span>
                          {createForm.task_type === 'group' && 
                           !createForm.assigned_to.includes(member.user_id.toString()) && 
                           createForm.assigned_to.length >= createForm.max_assignees && (
                            <span className="text-xs text-gray-400 ml-2">(Max reached)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                  {createForm.task_type === 'group' && createForm.assigned_to.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {createForm.assigned_to.length} of {createForm.max_assignees} assignees selected
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={createForm.due_date}
                      onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Submission Modal */}
        {showSubmissionModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Submit Task: {selectedTask.title}</h3>
              
              {isDeadlinePassed(selectedTask.deadline) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ This task deadline has passed ({formatDate(selectedTask.deadline)}). Submission may be rejected.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmitTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Submission Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.submission_link}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submission_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/proof-of-completion"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Submission Notes
                  </label>
                  <textarea
                    value={submissionForm.submission_notes}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submission_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
                    placeholder="Describe what you've completed, any challenges faced, or additional notes..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionModal(false);
                      setSelectedTask(null);
                      setSubmissionForm({ submission_link: '', submission_notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Review Modal */}
        {showReviewModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Review Task: {selectedTask.title}</h3>
              
              {/* Task Submission Details */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
                {selectedTask.submission_notes && (
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{selectedTask.submission_notes}</p>
                )}
                {selectedTask.submission_link && (
                  <a 
                    href={selectedTask.submission_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View submission link →
                  </a>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Submitted: {formatDate(selectedTask.submitted_at)}
                </p>
              </div>
              
              <form onSubmit={handleReviewTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="approve"
                        checked={reviewForm.action === 'approve'}
                        onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-green-700 font-medium">Approve and mark as completed</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="reject"
                        checked={reviewForm.action === 'reject'}
                        onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-red-700 font-medium">Reject and request resubmission</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewForm.review_notes}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                    placeholder="Provide feedback to the task assignee..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedTask(null);
                      setReviewForm({ action: 'approve', review_notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      reviewForm.action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isLoading ? 'Processing...' : (reviewForm.action === 'approve' ? 'Approve Task' : 'Reject Task')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Individual Assignment Review Modal */}
        {showIndividualReviewModal && selectedAssignment && selectedTask && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Review Submission: {selectedAssignment.full_name}
              </h3>
              
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                Task: <span className="font-medium text-gray-900 dark:text-white">{selectedTask.title}</span>
              </div>
              
              {/* Individual Submission Details */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
                {selectedAssignment.TaskAssignment?.submission_notes && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Notes:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {selectedAssignment.TaskAssignment.submission_notes}
                    </p>
                  </div>
                )}
                {selectedAssignment.TaskAssignment?.submission_link && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Link:</span>
                    <a 
                      href={selectedAssignment.TaskAssignment.submission_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm ml-2"
                    >
                      {selectedAssignment.TaskAssignment.submission_link} →
                    </a>
                  </div>
                )}
                {selectedAssignment.TaskAssignment?.submitted_at && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submitted: {formatDate(selectedAssignment.TaskAssignment.submitted_at)}
                  </p>
                )}
              </div>
              
              <form onSubmit={handleReviewIndividualAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="approve"
                        checked={individualReviewForm.action === 'approve'}
                        onChange={(e) => setIndividualReviewForm({ ...individualReviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-green-700 font-medium">Approve this submission</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="reject"
                        checked={individualReviewForm.action === 'reject'}
                        onChange={(e) => setIndividualReviewForm({ ...individualReviewForm, action: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-red-700 font-medium">Reject this submission</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes (for {selectedAssignment.full_name})
                  </label>
                  <textarea
                    value={individualReviewForm.review_notes}
                    onChange={(e) => setIndividualReviewForm({ ...individualReviewForm, review_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                    placeholder="Provide feedback to this team member..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIndividualReviewModal(false);
                      setSelectedAssignment(null);
                      setIndividualReviewForm({ action: 'approve', review_notes: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      individualReviewForm.action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isLoading ? 'Processing...' : (individualReviewForm.action === 'approve' ? 'Approve' : 'Reject')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                <button
                  onClick={() => {
                    setShowTaskDetailModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column - Task Details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Task Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Priority:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority} priority
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Task Type:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedTask.task_type === 'group' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedTask.task_type === 'group' ? `Group (max: ${selectedTask.max_assignees || 1})` : 'Individual'}
                        </span>
                      </div>
                      
                      {selectedTask.deadline && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Deadline:</span>
                          <span className={isDeadlinePassed(selectedTask.deadline) ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {formatDate(selectedTask.deadline)}
                            {isDeadlinePassed(selectedTask.deadline) && ' (Overdue)'}
                          </span>
                        </div>
                      )}
                      
                      {selectedTask.estimated_hours && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Estimated Hours:</span>
                          <span className="text-gray-900 dark:text-white">{selectedTask.estimated_hours}h</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Created:</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(selectedTask.created_at)}</span>
                      </div>
                      
                      {selectedTask.creator && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Created by:</span>
                          <span className="text-gray-900 dark:text-white">{selectedTask.creator.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedTask.description && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>
                  )}

                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Assignment & Activity */}
                <div className="space-y-6">
                  {/* Assignees */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Assignees {selectedTask.task_type === 'group' && `(${selectedTask.assignees?.length || 0}/${selectedTask.max_assignees || 1})`}
                    </h3>
                    {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.assignees.map((assignee) => {
                          const assignment = assignee.TaskAssignment;
                          const isAdmin = selectedCommunity?.UserCommunity?.role === 'community_admin' || user?.role === 'platform_admin';
                          const canReview = isAdmin && assignment?.status === 'submitted';
                          
                          return (
                            <div key={assignee.user_id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-600">
                                      {assignee.full_name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-white">{assignee.full_name}</span>
                                    {assignment?.status && (
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                                          {assignment.status}
                                        </span>
                                        {assignment.submitted_at && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Submitted {formatDate(assignment.submitted_at)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {/* Individual submission review button for group tasks */}
                                  {canReview && selectedTask.task_type === 'group' && (
                                    <button
                                      onClick={() => {
                                        setSelectedAssignment(assignee);
                                        setIndividualReviewForm({ action: 'approve', review_notes: '' });
                                        setShowIndividualReviewModal(true);
                                      }}
                                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors flex items-center space-x-1"
                                      title="Review this submission"
                                    >
                                      <span>Review</span>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  )}
                                  
                                  {/* Show review status for reviewed assignments */}
                                  {assignment?.status === 'completed' && (
                                    <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                                  )}
                                  {assignment?.status === 'rejected' && (
                                    <span className="text-xs text-red-600 font-medium">✗ Rejected</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show submission link and notes for admins if submitted */}
                              {isAdmin && assignment?.submission_link && ['submitted', 'completed', 'rejected'].includes(assignment?.status) && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Submission:</div>
                                  <a 
                                    href={assignment.submission_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {assignment.submission_link}
                                  </a>
                                  {assignment.submission_notes && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                                      {assignment.submission_notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No assignees</p>
                    )}
                  </div>

                  {/* Submission Details */}
                  {selectedTask.status === 'submitted' && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Submission Details</h3>
                      {selectedTask.submitted_at && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Submitted on: </span>
                          <span className="text-gray-900 dark:text-white">{formatDate(selectedTask.submitted_at)}</span>
                        </div>
                      )}
                      {selectedTask.submission_link && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Link: </span>
                          <a href={selectedTask.submission_link} target="_blank" rel="noopener noreferrer" 
                             className="text-primary-600 hover:text-primary-800 underline">
                            {selectedTask.submission_link}
                          </a>
                        </div>
                      )}
                      {selectedTask.submission_notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Notes: </span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{selectedTask.submission_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Details */}
                  {['completed', 'rejected'].includes(selectedTask.status) && selectedTask.review_notes && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Review</h3>
                      <div className={`p-3 border rounded-lg ${selectedTask.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-sm font-medium ${selectedTask.status === 'completed' ? 'text-green-800' : 'text-red-800'}`}>
                          {selectedTask.status === 'completed' ? 'Approved' : 'Rejected'}
                        </p>
                        {selectedTask.reviewed_at && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Reviewed on {formatDate(selectedTask.reviewed_at)}
                          </p>
                        )}
                        <p className={`text-sm mt-2 ${selectedTask.status === 'completed' ? 'text-green-700' : 'text-red-700'}`}>
                          {selectedTask.review_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const userAssignment = selectedTask.assignees?.find(a => a.user_id === user.user_id);
                        const isAssignedToUser = !!userAssignment;
                        const currentAssigneeCount = selectedTask.assignees?.length || 0;
                        
                        // Get assignment status - check multiple possible paths
                        const assignmentStatus = userAssignment?.TaskAssignment?.status || 
                                                userAssignment?.status || 
                                                (selectedTask.task_type === 'individual' ? selectedTask.status : null);
                        
                        // Allow self-assignment for group tasks even when status is 'submitted' if slots available
                        const allowedStatuses = selectedTask.task_type === 'group' 
                          ? ['not_started', 'in_progress', 'submitted']
                          : ['not_started', 'in_progress'];
                        const canSelfAssign = !isAssignedToUser && 
                          allowedStatuses.includes(selectedTask.status) &&
                          (selectedTask.task_type === 'individual' ? currentAssigneeCount === 0 : currentAssigneeCount < (selectedTask.max_assignees || 1));
                        const canAccept = isAssignedToUser && userAssignment.TaskAssignment?.status === 'assigned';
                        const canStartWorking = isAssignedToUser && userAssignment.TaskAssignment?.status === 'accepted';
                        const canSubmit = isAssignedToUser && ['accepted', 'in_progress'].includes(userAssignment.TaskAssignment?.status) && !isDeadlinePassed(selectedTask.deadline);
                        const canReview = selectedTask.status === 'submitted' && selectedCommunity?.UserCommunity?.role === 'community_admin';
                        const isAdmin = selectedCommunity?.UserCommunity?.role === 'community_admin' || user?.role === 'platform_admin';

                        return (
                          <>
                            {canSelfAssign && (
                              <button
                                onClick={() => {
                                  handleSelfAssign(selectedTask.task_id);
                                  setShowTaskDetailModal(false);
                                }}
                                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
                              >
                                Self Assign
                              </button>
                            )}
                            
                            {canAccept && (
                              <button
                                onClick={() => {
                                  handleUpdateTaskStatus(selectedTask.task_id, 'accepted');
                                  setShowTaskDetailModal(false);
                                }}
                                className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-colors"
                              >
                                Accept Task
                              </button>
                            )}
                            
                            {canStartWorking && (
                              <button
                                onClick={() => {
                                  handleUpdateTaskStatus(selectedTask.task_id, 'in_progress');
                                  setShowTaskDetailModal(false);
                                }}
                                className="px-3 py-2 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors"
                              >
                                Start Working
                              </button>
                            )}
                            
                            {canSubmit && (
                              <button
                                onClick={() => {
                                  setShowTaskDetailModal(false);
                                  setShowSubmissionModal(true);
                                }}
                                className="px-3 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition-colors"
                              >
                                Submit Task
                              </button>
                            )}
                            
                            {canReview && (
                              <button
                                onClick={() => {
                                  setShowTaskDetailModal(false);
                                  setShowReviewModal(true);
                                }}
                                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors"
                              >
                                Review Task
                              </button>
                            )}

                            {isAssignedToUser && assignmentStatus && !['accepted', 'completed', 'submitted', 'rejected'].includes(assignmentStatus) && (
                              <button
                                onClick={() => {
                                  handleRevokeTask(selectedTask.task_id);
                                  setShowTaskDetailModal(false);
                                }}
                                className="px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                              >
                                Revoke Assignment
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  handleDeleteTask(selectedTask.task_id);
                                  setShowTaskDetailModal(false);
                                }}
                                className="px-3 py-2 text-sm bg-gray-700 text-white hover:bg-gray-800 rounded-lg font-medium transition-colors"
                              >
                                Delete Task
                              </button>
                            )}

                            {isAdmin && selectedTask.task_type === 'group' && currentAssigneeCount < (selectedTask.max_assignees || 1) && (
                              <button
                                onClick={async () => {
                                  setShowAssignUsersModal(true);
                                  // Fetch community members when opening the modal using the task's community_id
                                  if (selectedTask?.community_id) {
                                    try {
                                      setIsFetchingMembers(true);
                                      const response = await api.get(`/communities/${selectedTask.community_id}/members`);
                                      console.log('Fetched community members:', response.data.members);
                                      setCommunityMembers(response.data.members || []);
                                    } catch (error) {
                                      console.error('Failed to fetch community members:', error);
                                      setError('Failed to load community members');
                                    } finally {
                                      setIsFetchingMembers(false);
                                    }
                                  }
                                }}
                                className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-medium transition-colors"
                              >
                                Assign Users
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Users Modal */}
        {showAssignUsersModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Users to Task</h2>
                <button
                  onClick={() => {
                    setShowAssignUsersModal(false);
                    setSelectedUsersToAssign([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Task: <span className="font-semibold text-gray-900 dark:text-white">{selectedTask.title}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Available Slots: <span className="font-semibold text-gray-900 dark:text-white">
                    {(selectedTask.max_assignees || 1) - (selectedTask.assignees?.length || 0)}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {isFetchingMembers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading community members...</p>
                  </div>
                ) : communityMembers && communityMembers.length > 0 ? (
                  communityMembers
                    .filter(member => !selectedTask.assignees?.some(a => a.user_id === member.user_id))
                    .map(member => (
                      <label
                        key={member.user_id}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 dark:bg-gray-800 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsersToAssign.includes(member.user_id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const availableSlots = (selectedTask.max_assignees || 1) - (selectedTask.assignees?.length || 0);
                              if (selectedUsersToAssign.length >= availableSlots) {
                                setError(`Can only assign ${availableSlots} more user(s)`);
                                return;
                              }
                              setSelectedUsersToAssign([...selectedUsersToAssign, member.user_id.toString()]);
                              setError('');
                            } else {
                              setSelectedUsersToAssign(selectedUsersToAssign.filter(id => id !== member.user_id.toString()));
                              setError('');
                            }
                          }}
                          className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </label>
                    ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">No available community members</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignUsersModal(false);
                    setSelectedUsersToAssign([]);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUsersToTask}
                  disabled={isLoading || selectedUsersToAssign.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Assigning...' : `Assign ${selectedUsersToAssign.length} User(s)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;