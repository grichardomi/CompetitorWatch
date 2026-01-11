'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Trial {
  id: string;
  userId: number;
  user: {
    id: number;
    email: string;
    name: string | null;
    createdAt: string;
  };
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  competitorLimit: number;
  competitorCount: number;
}

export default function AdminTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'grace_period' | 'expired'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTrials();
  }, [filter]);

  const loadTrials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const res = await fetch(`/api/admin/trials?${params}`);
      if (!res.ok) throw new Error('Failed to load trials');

      const data = await res.json();
      setTrials(data.trials || []);
    } catch (error) {
      console.error('Failed to load trials:', error);
      setMessage({ type: 'error', text: 'Failed to load trials' });
    } finally {
      setLoading(false);
    }
  };

  const extendTrial = async (userId: number, days: number) => {
    setActionLoading(`extend-${userId}`);
    try {
      const res = await fetch('/api/admin/trials/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days }),
      });

      if (!res.ok) throw new Error('Failed to extend trial');

      setMessage({ type: 'success', text: `Trial extended by ${days} days` });
      loadTrials();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to extend trial' });
    } finally {
      setActionLoading(null);
    }
  };

  const convertToPaid = async (userId: number, planId: string) => {
    setActionLoading(`convert-${userId}`);
    try {
      const res = await fetch('/api/admin/trials/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      });

      if (!res.ok) throw new Error('Failed to convert trial');

      setMessage({ type: 'success', text: 'Trial converted to paid subscription' });
      loadTrials();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to convert trial' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'trialing') {
      if (daysRemaining <= 3) {
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Expiring Soon ({daysRemaining}d)</span>;
      }
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Active ({daysRemaining}d)</span>;
    }
    if (status === 'grace_period') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Grace Period</span>;
    }
    if (status === 'expired') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  const stats = {
    active: trials.filter(t => t.status === 'trialing').length,
    gracePeriod: trials.filter(t => t.status === 'grace_period').length,
    expired: trials.filter(t => t.status === 'expired').length,
    expiringSoon: trials.filter(t => t.status === 'trialing' && t.daysRemaining <= 3).length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trial Management</h1>
        <p className="text-gray-600 mt-1">Manage trial subscriptions, extensions, and conversions</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Active Trials</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Expiring Soon</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.expiringSoon}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Grace Period</p>
          <p className="text-3xl font-bold mt-2 text-orange-600">{stats.gracePeriod}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Expired</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Trials
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('grace_period')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'grace_period' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Grace Period
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg font-medium ${filter === 'expired' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Trials Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading trials...</div>
        ) : trials.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No trials found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ends</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trials.map((trial) => (
                  <tr key={trial.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{trial.user.name || 'No name'}</div>
                      <div className="text-xs text-gray-600">{trial.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(trial.status, trial.daysRemaining)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(trial.currentPeriodStart).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(trial.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {trial.competitorCount} / {trial.competitorLimit}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {trial.status === 'trialing' && (
                          <>
                            <button
                              onClick={() => extendTrial(trial.userId, 7)}
                              disabled={actionLoading === `extend-${trial.userId}`}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {actionLoading === `extend-${trial.userId}` ? 'Extending...' : '+7 days'}
                            </button>
                            <button
                              onClick={() => convertToPaid(trial.userId, 'price_starter')}
                              disabled={actionLoading === `convert-${trial.userId}`}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              {actionLoading === `convert-${trial.userId}` ? 'Converting...' : 'Convert'}
                            </button>
                          </>
                        )}
                        {trial.status === 'grace_period' && (
                          <button
                            onClick={() => extendTrial(trial.userId, 3)}
                            disabled={actionLoading === `extend-${trial.userId}`}
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50"
                          >
                            {actionLoading === `extend-${trial.userId}` ? 'Extending...' : '+3 days'}
                          </button>
                        )}
                        <Link
                          href={`/admin/users?email=${encodeURIComponent(trial.user.email)}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View User
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
