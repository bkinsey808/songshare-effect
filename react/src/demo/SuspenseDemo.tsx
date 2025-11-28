import { Suspense } from "react";

import {
	DEMO_PROFILE_DELAY_MS,
	DEMO_POSTS_DELAY_MS,
	DEMO_POSTS_COUNT,
} from "@/shared/constants/http";
import { createSuspenseCache } from "@/shared/utils/typedPromiseCache";

// Suspense-friendly typed caches to store Promise<T> while pending and T when resolved
// Use separate caches per data-type so we keep strong typing and avoid unsafe assertions.
type DemoUser = Readonly<{
	id: number;
	name: string;
	email: string;
	bio: string;
}>;
type DemoPost = Readonly<{ id: number; title: string; content: string }>;

const userCache = createSuspenseCache<DemoUser>("demo:user");
const postsCache = createSuspenseCache<DemoPost[]>("demo:posts");

// File-local constants to avoid magic-number literals in this demo
const POST_SAMPLE_COUNT = 3;
const ZERO = 0;
const ONE = 1;

// Utility function to create a suspending fetch
function suspendingFetch<ResultType>(
	cache: ReturnType<typeof createSuspenseCache<ResultType>>,
	key: string,
	fetcher: () => Promise<ResultType>,
): ResultType {
	const maybe = cache.getOrThrow(key, fetcher);
	if (maybe instanceof Promise) {
		// suspend by throwing the pending promise (intentionally throwing non-Error)
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw maybe;
	}

	return maybe;
}

type UserProfileParams = Readonly<{
	userId: number;
}>;

// Component that fetches user data and suspends
function UserProfile({ userId }: UserProfileParams): ReactElement {
	const user = suspendingFetch(userCache, `user-${userId}`, async () => {
		// Simulate API delay
		await new Promise<void>((resolve) =>
			setTimeout(resolve, DEMO_PROFILE_DELAY_MS),
		);

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

type UserPostParams = Readonly<{
	userId: number;
}>;

// Component that fetches posts and suspends
function UserPosts({ userId }: UserPostParams): ReactElement {
	const posts = suspendingFetch(postsCache, `posts-${userId}`, async () => {
		// Simulate API delay
		await new Promise<void>((resolve) =>
			setTimeout(resolve, DEMO_POSTS_DELAY_MS),
		);

		// Mock posts data (generated to avoid magic number literals)
		return Array.from({ length: POST_SAMPLE_COUNT }).map(
			(_unusedVal, index) => {
				const id = index + ONE;

				let title = "New Playlist";
				if (index === ZERO) {
					title = "My Favorite Song";
				} else if (index === ONE) {
					title = "Concert Review";
				}

				let content = "Created a new playlist for working out.";
				if (index === ZERO) {
					content = "Just discovered this amazing track!";
				} else if (index === ONE) {
					content = "Went to see my favorite band last night.";
				}

				return { id, title, content };
			},
		);
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
			{Array.from({ length: DEMO_POSTS_COUNT }).map((_unusedVal, idx) => (
				<div
					key={idx}
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
	function clearCache(): void {
		// clear both type-specific caches used in this demo
		userCache.clear();
		postsCache.clear();
		// Force re-render by updating a key or state if needed
		window.location.reload();
	}

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
