'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  description: string;
}

interface IncidentHistory {
  date: string;
  title: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  description: string;
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);

  // In a real implementation, this would fetch from an API
  const systems: SystemStatus[] = [
    {
      name: 'Web Application',
      status: 'operational',
      description: 'Dashboard and user interface',
    },
    {
      name: 'API',
      status: 'operational',
      description: 'REST API endpoints',
    },
    {
      name: 'Crawler Service',
      status: 'operational',
      description: 'Competitor website monitoring',
    },
    {
      name: 'Alert System',
      status: 'operational',
      description: 'Email and notification delivery',
    },
    {
      name: 'Database',
      status: 'operational',
      description: 'Data storage and retrieval',
    },
  ];

  const recentIncidents: IncidentHistory[] = [
    {
      date: 'Jan 10, 2026',
      title: 'Scheduled Maintenance',
      status: 'resolved',
      description: 'Database maintenance completed successfully with no data loss.',
    },
  ];

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Service Outage';
      default:
        return 'Unknown';
    }
  };

  const allOperational = systems.every((s) => s.status === 'operational');

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            MarketPulse
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              System Status
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Real-time status of MarketPulse services
            </p>
          </div>

          {/* Overall Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    allOperational ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`}
                ></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {allOperational ? 'All Systems Operational' : 'Service Issues Detected'}
                </h2>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdated || 'Loading...'}
            </p>
          </div>

          {/* System Components */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">System Components</h2>
            <div className="space-y-4">
              {systems.map((system) => (
                <div
                  key={system.name}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {system.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">{system.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}></div>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {getStatusText(system.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Uptime (30 days)</p>
              <p className="text-3xl font-bold text-green-600">99.99%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-blue-600">120ms</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-1">Incidents (30 days)</p>
              <p className="text-3xl font-bold text-gray-900">1</p>
            </div>
          </div>

          {/* Incident History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
            {recentIncidents.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No incidents in the last 30 days
              </p>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {incident.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium whitespace-nowrap ml-2">
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{incident.description}</p>
                    <p className="text-xs text-gray-500">{incident.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscribe to Updates */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Get Status Updates
            </h2>
            <p className="text-gray-600 mb-4">
              Subscribe to receive notifications about system status changes
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Subscribe to Updates
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
