const env = import.meta.env

export const SITE = {
  name: 'Faculty-Finder',
  university: (env.VITE_UNIVERSITY_NAME as string | undefined)?.trim() || 'University',
  githubUrl: (env.VITE_GITHUB_URL as string | undefined)?.trim() || '',
  csvUrl: (env.VITE_CSV_URL as string | undefined)?.trim() || '/faculty.json',
  assetBaseUrl: (env.VITE_ASSET_BASE_URL as string | undefined)?.trim() || undefined,
  /** Admin page password. Set VITE_ADMIN_PASSWORD in your .env.local or Vercel dashboard. */
  adminPassword: (env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || 'admin1234',
}
