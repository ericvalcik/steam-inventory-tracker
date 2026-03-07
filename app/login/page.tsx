import { login } from "@/app/actions/login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-8 py-10 bg-zinc-900 rounded-xl border border-zinc-800">
        <h1 className="text-lg font-semibold text-white mb-6">CS2 Inventory</h1>
        <form action={login} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          {error && (
            <p className="text-xs text-red-400">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
