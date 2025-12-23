"use client";
import React, { useState } from 'react';
import SearchBar from './components/SearchBar';

const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGithubData = async (username) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("User not found or API error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-gray-600 font-medium">Analyzing GitHub Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen  pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        {!data ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              GitProfile <span className="text-white">AI</span>
            </h1>
            <p className="text-shadow-white mb-8 text-lg max-w-md">
              Enter a GitHub username to get a professional AI-powered analysis and portfolio.
            </p>
            <div className="w-full max-w-md">
              <SearchBar onSearch={fetchGithubData} />
            </div>
            {error && <p className="mt-4 text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 space-y-8">
            
            {/* --- PROFILE CARD --- */}
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative">
                <img 
                  src={data.profile.avatarUrl} 
                  alt={data.profile.name} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover shadow-inner border-4 border-white"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{data.profile.name || data.profile.username}</h1>
                  <span className="text-gray-400 font-mono">@{data.profile.username}</span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{data.profile.bio || "No bio available"}</p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="px-4 py-2 bg-gray-100 rounded-xl">
                    <span className="font-bold text-gray-900">{data.profile.followers}</span>
                    <span className="ml-1 text-gray-500 text-sm">Followers</span>
                  </div>
                  <div className="px-4 py-2 bg-gray-100 rounded-xl">
                    <span className="font-bold text-gray-900">{data.profile.following}</span>
                    <span className="ml-1 text-gray-500 text-sm">Following</span>
                  </div>
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <span className="font-bold">{data.profile.publicRepos}</span>
                    <span className="ml-1 text-sm font-medium">Repos</span>
                  </div>
                </div>
              </div>
            </section>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Open PRs" value={data.pullRequests.open} color="blue" />
              <StatCard title="Merged PRs" value={data.pullRequests.merged} color="green" />
              <StatCard title="Recent Commits" value={data.recentActivity.commits} color="purple" />
              <StatCard title="Active Repos" value={data.recentActivity.activeRepositories} color="orange" />
            </div>

            {/* --- TOP PROJECTS SECTION --- */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Featured Projects</h2>
                  <p className="text-gray-500 text-sm">Most starred and recently updated work</p>
                </div>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full transition-colors">
                  View All Repositories
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.repos.slice(0, 6).map((repo) => (
                  <div 
                    key={repo.id} 
                    className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer"
                    onClick={() => window.open(repo.url, '_blank')}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {repo.name}
                      </h3>
                      {repo.language && (
                        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                      {repo.description || "No description provided for this project."}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-500">★</span> {repo.stars}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>🍴</span> {repo.forks}
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto text-[11px]">
                        UPDATED {new Date(repo.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  };

  return (
    <div className={`p-6 rounded-2xl border-2 ${colors[color]} transition-transform hover:scale-[1.02]`}>
      <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-1">{title}</h3>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
};

export default HomePage;