'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  authMethods: string[];
  subscription?: {
    status: string;
    stripePriceId: string;
  } | null;
  _count: {
    businesses: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');

      if (!res.ok) {
        throw new Error('Failed to load users');
      }

      const data = await res.json();
      setUsers(data.users);
      setError('');
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">View and manage all user accounts</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Auth</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subscription</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Businesses</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">
                    {search ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {user.authMethods.map((method) => (
                          <span
                            key={method}
                            className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                            title={method === 'google' ? 'Google OAuth' : 'Email/Password'}
                          >
                            {method === 'google' ? 'G' : 'P'}
                          </span>
                        ))}
                        {user.authMethods.length === 0 && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.subscription ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.subscription.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user.subscription.status === 'trialing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.subscription.status}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">{user._count.businesses}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </main>
  );
}
