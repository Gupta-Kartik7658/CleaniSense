// frontend/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PollutionService } from '@/services/pollutionService';
import { User } from '@/types/pollution';
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Shield,
  Ban,
  CheckCircle,
  UserCheck,
  UserX,
  AlertCircle,
  Download,
  Plus,
  Users as UsersIcon,
  Clock,
  Activity,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  RefreshCw,
  X,
  Check,
  Calendar
} from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  role: 'citizen' | 'municipality_officer' | 'municipality_admin' | 'super_admin';
  status: 'active' | 'suspended' | 'banned';
  phone: string;
  city: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'citizen',
    status: 'active',
    phone: '',
    city: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await PollutionService.getUsers();
      if (response && response.users) {
        setUsersList(response.users);
      } else {
        setUsersList([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Sorting
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  // Combined filters and client sorting logic
  const processedUsers = useMemo(() => {
    let result = [...usersList];

    // 1. Role Filter
    if (selectedRole !== 'all') {
      result = result.filter(u => u.role.toLowerCase() === selectedRole.toLowerCase());
    }

    // 2. Status Filter
    if (selectedStatus !== 'all') {
      result = result.filter(u => u.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // 3. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.city && u.city.toLowerCase().includes(term)) ||
        (u.phone && u.phone.includes(term))
      );
    }

    // 4. Sorting logic
    result.sort((a: any, b: any) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [usersList, selectedRole, selectedStatus, searchTerm, sortBy, sortDirection]);

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      await PollutionService.updateUserStatus(userId, newStatus);
      setUsersList(prev =>
        prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u)
      );
      showToast(`User status updated to ${newStatus}`, 'success');
    } catch (e: any) {
      console.error('Failed to update status on server:', e);
      showToast(`Failed to update status: ${e.message || e}`, 'error');
    }
  };

  const handleAddUser = () => {
    alert('User creation is not supported by the frozen backend contract.');
  };

  const handleEditUser = (user: User) => {
    alert('User profile edit is not supported by the frozen backend contract.');
  };

  const handleUpdateUser = () => {
    alert('User update is not supported by the frozen backend contract.');
  };

  const handleDeleteUser = (id: string) => {
    alert('User deletion is not supported by the frozen backend contract.');
  };

  const confirmDelete = () => {
    return;
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(prev => prev.filter(item => item !== id));
    } else {
      setSelectedUsers(prev => [...prev, id]);
    }
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === processedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(processedUsers.map(u => u.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (action === 'Delete') {
      setUsersList(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      showToast('Selected users deleted', 'success');
    } else {
      const statusMap: any = { 'Activate': 'active', 'Suspend': 'suspended' };
      const newStatus = statusMap[action];
      setUsersList(prev =>
        prev.map(u => selectedUsers.includes(u.id) ? { ...u, status: newStatus } : u)
      );
      showToast(`Selected users updated to ${newStatus}`, 'success');
    }
    setSelectedUsers([]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400';
      case 'super_admin': return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400';
      case 'municipality_admin': return 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400';
      case 'municipality_officer': return 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400';
      case 'moderator': return 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400';
      default: return 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400';
      case 'suspended': return 'border-amber-250 dark:border-amber-900 bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-400';
      default: return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400';
    }
  };

  const getSortIndicator = (key: string) => {
    if (sortBy !== key) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-zinc-950 text-white rounded-lg shadow-xl border border-zinc-800 text-xs font-bold animate-fade-in flex items-center gap-2">
          {toastMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
          {toastMessage.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">Manage Users</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">View accounts, roles, registration histories, and status logs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled
            className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-550 text-sm font-semibold rounded-md cursor-not-allowed flex items-center gap-2 border border-transparent"
          >
            <UserPlus className="h-4 w-4" />
            Add Account (Unavailable)
          </button>
        </div>
      </div>

      {/* Filters & Search Menu */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-450 shadow-sm"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-450 shadow-sm cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="citizen">Citizen</option>
          <option value="municipality_officer">Municipality Officer</option>
          <option value="municipality_admin">Municipality Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-450 shadow-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <div className="flex bg-white dark:bg-white dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            <UsersIcon className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            <Activity className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Bulk actions menu */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg animate-fade-in text-left">
          <span className="text-xs font-bold dark:text-zinc-400 dark:text-zinc-300">{selectedUsers.length} users selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('Activate')}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 hover:bg-emerald-100 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('Suspend')}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-400 border border-amber-250 hover:bg-amber-100 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Suspend
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Users List Container (Scrollable Long List) */}
      {processedUsers.length === 0 ? (
        <div className="py-16 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
          <AlertCircle className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          <p className="text-sm font-bold dark:text-zinc-400 dark:text-zinc-300">No users found matching search or filter choices.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Scrollable long list */
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-zinc-150 dark:divide-zinc-800">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10">
                  <th className="px-6 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={processedUsers.length > 0 && selectedUsers.length === processedUsers.length}
                      onChange={toggleAllUsers}
                      className="rounded border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-zinc-950 focus:ring-zinc-950"
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    User{getSortIndicator('name')}
                  </th>
                  <th 
                    onClick={() => handleSort('role')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Role{getSortIndicator('role')}
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Status{getSortIndicator('status')}
                  </th>
                  <th 
                    onClick={() => handleSort('reportsCount')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Reports{getSortIndicator('reportsCount')}
                  </th>
                  <th 
                    onClick={() => handleSort('city')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Location{getSortIndicator('city')}
                  </th>
                  <th 
                    onClick={() => handleSort('joinedAt')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Joined{getSortIndicator('joinedAt')}
                  </th>
                  <th 
                    onClick={() => handleSort('lastActive')}
                    className="px-6 py-4 text-left text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-950 dark:text-white dark:hover:text-white transition-colors"
                  >
                    Last Active{getSortIndicator('lastActive')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold dark:text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="rounded border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-zinc-950 focus:ring-zinc-950"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-left">
                        <img
                          className="h-9 w-9 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=18181b&color=fff`}
                          alt={user.name}
                        />
                        <div>
                          <div className="text-sm font-bold text-zinc-950 dark:text-white">{user.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{user.reportsCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-xs dark:text-zinc-400 dark:text-zinc-400 font-medium">
                      {user.city || 'Mumbai'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-xs dark:text-zinc-400 dark:text-zinc-400 font-medium">
                      {user.joinedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-xs dark:text-zinc-500 dark:text-zinc-400 font-medium">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/profile?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&role=${user.role}&status=${user.status}&city=${user.city || 'Mumbai'}`)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          disabled
                          className="p-1.5 text-zinc-300 dark:text-zinc-750 cursor-not-allowed"
                          title="User editing is unsupported"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          disabled
                          className="p-1.5 text-zinc-300 dark:text-zinc-750 cursor-not-allowed"
                          title="User deletion is unsupported"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Layout (Long Scrollable list) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 text-left max-h-[650px] overflow-y-auto pr-1">
          {processedUsers.map((user) => (
            <div key={user.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-850"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=18181b&color=fff`}
                      alt={user.name}
                    />
                    <div>
                      <div className="text-sm font-bold text-zinc-950 dark:text-white dark:text-white truncate max-w-[120px]">{user.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{user.email}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded border capitalize ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Role</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getRoleColor(user.role)}`}>{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Reports</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{user.reportsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Location</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.city || 'Mumbai'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 dark:text-zinc-500">Last Active</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{user.lastActive}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  onClick={() => router.push(`/profile?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}&role=${user.role}&status=${user.status}&city=${user.city || 'Mumbai'}`)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer text-center"
                >
                  View Profile
                </button>
                <button
                  disabled
                  className="px-2.5 py-1.5 text-xs font-bold text-zinc-350 dark:text-zinc-700 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded cursor-not-allowed"
                >
                  Edit (N/A)
                </button>
                <button
                  disabled
                  className="p-1.5 text-zinc-350 dark:text-zinc-700 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg p-6 z-10 text-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:dark:text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-zinc-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-450"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-450"
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-455"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="municipality_officer">Municipality Officer</option>
                    <option value="municipality_admin">Municipality Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-455"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-450"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-450"
                  placeholder="Enter city"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded-md transition-colors shadow-sm cursor-pointer"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg p-6 z-10 text-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white dark:text-white">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:dark:text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-zinc-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-455"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-md text-zinc-400 outline-none cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-705 dark:text-zinc-300 outline-none focus:border-zinc-455"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="municipality_officer">Municipality Officer</option>
                    <option value="municipality_admin">Municipality Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-705 dark:text-zinc-300 outline-none focus:border-zinc-455"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-455"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-455"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded-md transition-colors shadow-sm cursor-pointer"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-md p-6 z-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-150 dark:bg-red-950/20 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white dark:text-white mb-2">Delete User</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 text-xs font-bold text-white bg-red-650 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
