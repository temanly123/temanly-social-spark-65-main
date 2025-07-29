import React from 'react';

const TalentDashboardSimple = () => {
  console.log('🚀 TalentDashboardSimple component loaded');
  
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Simple Test</h1>
        <p className="text-lg mb-4">If you can see this, React is working!</p>
        <p className="text-sm text-gray-500 mb-4">This is a minimal test component.</p>
        
        <div className="space-y-2">
          <a 
            href="/talent-dashboard-debug" 
            className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Debug Page
          </a>
          <a 
            href="/talent-dashboard" 
            className="block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Try Original Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TalentDashboardSimple;
