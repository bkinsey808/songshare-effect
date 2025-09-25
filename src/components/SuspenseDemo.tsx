import { type ReactElement, Suspense } from "react";

// Simple cache to store promises and their results
const promiseCache = new Map<string, Promise<unknown> | unknown>();

// Utility function to create a suspending fetch
function suspendingFetch<T>(key: string, fetcher: () => Promise<T>): T {
	if (promiseCache.has(key)) {
		const cached = promiseCache.get(key);

		// If it's still a promise, throw it to suspend
		if (cached instanceof Promise) {
			throw cached;
		}

		// Return the resolved value (type assertion since we know the type from the cache key pattern)
		return cached as T;
	}

	// Create and cache the promise
	const promise = fetcher().then(
		(result) => {
			// Cache the resolved value
			promiseCache.set(key, result);
			return result;
		},
		(error) => {
			// Remove from cache on error so it can be retried
			promiseCache.delete(key);
			throw error;
		},
	);

	promiseCache.set(key, promise);
	throw promise; // Suspend until the promise resolves
}

// Component that fetches user data and suspends
function UserProfile({ userId }: { userId: number }): ReactElement {
	const user = suspendingFetch(`user-${userId}`, async () => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Mock user data
		return {
			id: userId,
			name: `User ${userId}`,
			email: `user${userId}@example.com`,
			bio: `This is the bio for user ${userId}. They love music and sharing songs!`,
		};
	});

	return (
		<div className="rounded-xl border border-white/10 bg-white/5 p-6">
			<h3 className="mb-3 text-xl font-semibold text-white">{user.name}</h3>
			<p className="mb-2 text-sm text-gray-300">{user.email}</p>
			<p className="text-sm text-gray-400">{user.bio}</p>
		</div>
	);
}

// Component that fetches posts and suspends
function UserPosts({ userId }: { userId: number }): ReactElement {
	const posts = suspendingFetch(`posts-${userId}`, async () => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Mock posts data
		return [
			{
				id: 1,
				title: "My Favorite Song",
				content: "Just discovered this amazing track!",
			},
			{
				id: 2,
				title: "Concert Review",
				content: "Went to see my favorite band last night.",
			},
			{
				id: 3,
				title: "New Playlist",
				content: "Created a new playlist for working out.",
			},
		];
	});

	return (
		<div className="space-y-4">
			{posts.map((post) => (
				<div
					key={post.id}
					className="rounded-lg border border-white/10 bg-white/5 p-4"
				>
					<h4 className="mb-2 font-semibold text-white">{post.title}</h4>
					<p className="text-sm text-gray-300">{post.content}</p>
				</div>
			))}
		</div>
	);
}

// Loading fallback components
function ProfileSkeleton(): ReactElement {
	return (
		<div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6">
			<div className="mb-3 h-6 rounded bg-gray-600"></div>
			<div className="mb-2 h-4 w-3/4 rounded bg-gray-600"></div>
			<div className="h-4 w-1/2 rounded bg-gray-600"></div>
		</div>
	);
}

function PostsSkeleton(): ReactElement {
	return (
		<div className="space-y-4">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-4"
				>
					<div className="mb-2 h-5 rounded bg-gray-600"></div>
					<div className="h-4 w-4/5 rounded bg-gray-600"></div>
				</div>
			))}
		</div>
	);
}

// Main demo component
export default function SuspenseDemo(): ReactElement {
	const clearCache = (): void => {
		promiseCache.clear();
		// Force re-render by updating a key or state if needed
		window.location.reload();
	};

	return (
		<div className="mb-12">
			<div className="mb-6 flex items-center justify-between">
				<h2 className="text-2xl font-bold text-white">🔄 Suspense Demo</h2>
				<button
					onClick={clearCache}
					className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
				>
					Clear Cache & Reload
				</button>
			</div>

			<p className="mb-6 text-gray-400">
				This demo shows React Suspense working with promises. The components
				below will suspend while fetching data, showing loading states until the
				promises resolve.
			</p>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div>
					<h3 className="mb-4 text-lg font-semibold text-white">
						User Profile
					</h3>
					<Suspense fallback={<ProfileSkeleton />}>
						<UserProfile userId={1} />
					</Suspense>
				</div>

				<div>
					<h3 className="mb-4 text-lg font-semibold text-white">User Posts</h3>
					<Suspense fallback={<PostsSkeleton />}>
						<UserPosts userId={1} />
					</Suspense>
				</div>
			</div>

			<div className="mt-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
				<h4 className="mb-2 font-semibold text-blue-300">How it works:</h4>
				<ul className="space-y-1 text-sm text-blue-200">
					<li>• Components throw promises to suspend rendering</li>
					<li>• Suspense boundaries catch these promises and show fallbacks</li>
					<li>• When promises resolve, components re-render with data</li>
					<li>• Results are cached to prevent refetching on re-renders</li>
				</ul>
			</div>
		</div>
	);
}
