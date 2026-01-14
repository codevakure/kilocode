/**
 * Get the documentation base URL from environment variable or default
 */
export function getDocsBaseUrl(): string {
	if (typeof window !== "undefined" && window.DOCS_BASE_URL) {
		return window.DOCS_BASE_URL.replace(/\/$/, "") // Remove trailing slash
	}
	return "https://kilo.ai/docs"
}

/**
 * Check if documentation links should be shown
 */
export function shouldShowDocLinks(): boolean {
	if (typeof window !== "undefined") {
		return window.SHOW_DOCUMENTATION_LINKS === true
	}
	return true // Default to showing if not set
}

/**
 * Utility for building Roo Code documentation links with UTM telemetry.
 *
 * @param path - The path after the docs root (no leading slash)
 * @param campaign - The UTM campaign context (e.g. "welcome", "provider_docs", "tips", "error_tooltip")
 * @returns The full docs URL with UTM parameters
 */
// kilocode_change: unused campaign param
export function buildDocLink(path: string, _campaign: string): string {
	// Remove any leading slash from path
	const cleanPath = path
		.replace(/^\//, "")
		.replace("troubleshooting/shell-integration/", "features/shell-integration") // kilocode_change
	const [basePath, hash] = cleanPath.split("#")
	const baseUrl = `${getDocsBaseUrl()}/${basePath}`
	return hash ? `${baseUrl}#${hash}` : baseUrl
}
