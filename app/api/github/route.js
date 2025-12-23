import  {NextResponse} from "next/server"

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const REPOS_PER_PAGE = 100;
const MAX_REPOS_TO_FETCH = 100; // Limit to avoid excessive API calls

function validateusername(username){
    if(!username || typeof username !== 'string'){
        return { valid: false, error: "Username is required" };

    }

     const sanitized = username.trim().toLowerCase();
  if (sanitized.length === 0 || sanitized.length > 39) {
    return { valid: false, error: "Invalid username format" };
  }

  if (!/^[a-z0-9-]+$/.test(sanitized)) {
    return { valid: false, error: "Username contains invalid characters" };
  }

  return { valid: true, username: sanitized };
}

function getGitHubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "gitprofile-ai/1.0",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function handleGitHubResponse(response, errorContext) {
  // Check rate limiting
  const remaining = parseInt(response.headers.get("x-ratelimit-remaining") || "0");
  const resetTime = parseInt(response.headers.get("x-ratelimit-reset")  || "0");

  if (response.status === 403 && remaining === 0) {
    const resetDate = new Date(resetTime * 1000);
    return {
      error: true,
      status: 429,
      message: "GitHub API rate limit exceeded",
      retryAfter: resetDate.toISOString(),
    };
  }

  if (response.status === 404) {
    return {
      error: true,
      status: 404,
      message: "User not found",
    };
  }

  if (response.status === 403) {
    return {
      error: true,
      status: 403,
      message: "Access forbidden. Check GitHub token permissions.",
    };
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    return {
      error: true,
      status: response.status,
      message: `${errorContext}: ${errorText}`,
    };
  }

  const data = await response.json().catch(() => null);
  if (!data) {
    return {
      error: true,
      status: 500,
      message: `${errorContext}: Invalid JSON response`,
    };
  }

  return { error: false, data, remaining, resetTime };
}

async function fetchAllRepos(username, headers){
    const repos = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && repos.length < MAX_REPOS_TO_FETCH) {
    const url = `${GITHUB_API}/users/${username}/repos?per_page=${REPOS_PER_PAGE}&sort=updated&page=${page}`;
    const response = await fetch(url, { headers, cache: "no-store" });
    const result = await handleGitHubResponse(response, "Failed to fetch repositories");

    if (result.error) {
      throw result;
    }

    const pageRepos = result.data || [];
    repos.push(...pageRepos);

      hasMore = pageRepos.length === REPOS_PER_PAGE && repos.length < MAX_REPOS_TO_FETCH;
    page++;
  }

  return repos.slice(0, MAX_REPOS_TO_FETCH);
}

function calculateRecentActivity(events) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const stats = {
    commits: 0,
    pullRequests: 0,
    issues: 0,
    repositories: new Set(),
  };

  events.forEach((event) => {
    const eventDate = new Date(event.created_at);
    if (eventDate < ninetyDaysAgo) return;

    switch (event.type) {
      case "PushEvent":
        stats.commits += event.payload.commits?.length || 0;
        if (event.repo?.name) {
          stats.repositories.add(event.repo.name);
        }
        break;
      case "PullRequestEvent":
        if (event.payload.action === "opened" || event.payload.action === "closed") {
          stats.pullRequests++;
        }
        break;
      case "IssuesEvent":
        if (event.payload.action === "opened") {
          stats.issues++;
        }
        break;
      case "CreateEvent":
      case "DeleteEvent":
      case "ForkEvent":
      case "WatchEvent":
        if (event.repo?.name) {
          stats.repositories.add(event.repo.name);
        }
        break;
    }
  });

  return {
    commits: stats.commits,
    pullRequests: stats.pullRequests,
    issues: stats.issues,
    activeRepositories: stats.repositories.size,
  };
}

function normalizeRepos(repos) {
  return repos
    .filter((repo) => !repo.fork) // Exclude forks
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || null,
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
      language: repo.language || null,
      isPrivate: repo.private,
      isArchived: repo.archived,
      isFork: repo.fork,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      defaultBranch: repo.default_branch,
      openIssues: repo.open_issues_count || 0,
      license: repo.license?.name || null,
      topics: repo.topics || [],
      homepage: repo.homepage || null,
      hasPages: repo.has_pages || false,
      hasWiki: repo.has_wiki || false,
      hasIssues: repo.has_issues || false,
      hasProjects: repo.has_projects || false,
    }))
    .sort((a, b) => {
      // Sort by stars (descending), then by updated date (descending)
      if (b.stars !== a.stars) return b.stars - a.stars;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}
function normalizeProfile(profile) {
  return {
    id: profile.id,
    username: profile.login,
    name: profile.name || null,
    bio: profile.bio || null,
    avatar: profile.avatar_url,
    avatarUrl: profile.avatar_url, // Alias for compatibility
    company: profile.company || null,
    blog: profile.blog || null,
    location: profile.location || null,
    email: profile.email || null,
    twitterUsername: profile.twitter_username || null,
    followers: profile.followers || 0,
    following: profile.following || 0,
    publicRepos: profile.public_repos || 0,
    publicGists: profile.public_gists || 0,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    profileUrl: profile.html_url,
    type: profile.type,
    siteAdmin: profile.site_admin || false,
  };
}
export async function POST(req) {
  try {
    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { username } = body;

    // Validate username
    const validation = validateusername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const sanitizedUsername = validation.username;

    // Check for GitHub token
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const headers = getGitHubHeaders();

    // Fetch all data in parallel for better performance
    const [profileRes, reposRes, totalPRRes, mergedPRRes, openPRRes, eventsRes] = await Promise.all([
      fetch(`${GITHUB_API}/users/${sanitizedUsername}`, { headers, cache: "no-store" }),
      fetchAllRepos(sanitizedUsername, headers),
      fetch(
        `${GITHUB_API}/search/issues?q=author:${sanitizedUsername}+type:pr&per_page=1`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${GITHUB_API}/search/issues?q=author:${sanitizedUsername}+type:pr+is:merged&per_page=1`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${GITHUB_API}/search/issues?q=author:${sanitizedUsername}+type:pr+is:open&per_page=1`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${GITHUB_API}/users/${sanitizedUsername}/events/public?per_page=100`,
        { headers, cache: "no-store" }
      ),
    ]);

    // Handle profile response
    const profileResult = await handleGitHubResponse(profileRes, "Failed to fetch profile");
    if (profileResult.error) {
      return NextResponse.json(
        { error: profileResult.message },
        { status: profileResult.status || 500 }
      );
    }

    // Handle PR search responses
    const [totalPRResult, mergedPRResult, openPRResult] = await Promise.all([
      handleGitHubResponse(totalPRRes, "Failed to fetch total PRs"),
      handleGitHubResponse(mergedPRRes, "Failed to fetch merged PRs"),
      handleGitHubResponse(openPRRes, "Failed to fetch open PRs"),
    ]);

    // Handle events response (non-critical, can fail gracefully)
    const eventsResult = await handleGitHubResponse(eventsRes, "Failed to fetch events");
    const events = eventsResult.error ? [] : eventsResult.data || [];

    // Calculate recent activity (last 90 days)
    const recentActivity = calculateRecentActivity(events);

    // Normalize data
    const normalizedProfile = normalizeProfile(profileResult.data);
    const normalizedRepos = normalizeRepos(reposRes);

    // Extract PR counts (handle errors gracefully)
    const prStats = {
      total: totalPRResult.error ? 0 : totalPRResult.data?.total_count || 0,
      merged: mergedPRResult.error ? 0 : mergedPRResult.data?.total_count || 0,
      open: openPRResult.error ? 0 : openPRResult.data?.total_count || 0,
      closed: 0, // Can be calculated: total - merged - open
    };
    prStats.closed = Math.max(0, prStats.total - prStats.merged - prStats.open);

    

    // Build response (maintain backward compatibility with frontend)
    const response = {
      profile: normalizedProfile,
      repos: normalizedRepos,
      pullRequests: prStats,
      // Backward compatibility: frontend expects 'recentContributions'
      recentContributions: {
        commits: recentActivity.commits,
        pullRequests: recentActivity.pullRequests,
        issues: recentActivity.issues,
      },
      // New field with more detailed activity data
      recentActivity,
      
      metadata: {
        fetchedAt: new Date().toISOString(),
        rateLimitRemaining: profileResult.remaining,
        rateLimitReset: profileResult.resetTime
          ? new Date(profileResult.resetTime * 1000).toISOString()
          : null,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-RateLimit-Remaining": String(profileResult.remaining || 0),
      },
    });
  } catch (error) {
    console.error("GitHub API Error:", error);

    // Handle known error types
    if (error.error && error.status) {
      return NextResponse.json(
        { error: error.message || "GitHub API error" },
        { status: error.status }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}