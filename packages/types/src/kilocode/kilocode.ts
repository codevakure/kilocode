import { z } from "zod"

declare global {
	interface Window {
		KILOCODE_BACKEND_BASE_URL: string | undefined
	}
}

export const ghostServiceSettingsSchema = z
	.object({
		enableAutoTrigger: z.boolean().optional(),
		enableSmartInlineTaskKeybinding: z.boolean().optional(),
		enableChatAutocomplete: z.boolean().optional(),
		provider: z.string().optional(),
		model: z.string().optional(),
		snoozeUntil: z.number().optional(),
		hasKilocodeProfileWithNoBalance: z.boolean().optional(),
	})
	.optional()

export type GhostServiceSettings = z.infer<typeof ghostServiceSettingsSchema>

/**
 * Map of provider names to their default autocomplete models.
 * These are the providers that support autocomplete functionality.
 */
export const AUTOCOMPLETE_PROVIDER_MODELS = new Map([
	["mistral", "codestral-latest"],
	["kilocode", "mistralai/codestral-2508"],
	["openrouter", "mistralai/codestral-2508"],
	["requesty", "mistral/codestral-latest"],
	["bedrock", "mistral.codestral-2508-v1:0"],
	["huggingface", "mistralai/Codestral-22B-v0.1"],
	["litellm", "codestral/codestral-latest"],
	["lmstudio", "mistralai/codestral-22b-v0.1"],
	["ollama", "codestral:latest"],
] as const)

export type AutocompleteProviderKey = typeof AUTOCOMPLETE_PROVIDER_MODELS extends Map<infer K, unknown> ? K : never

export const commitRangeSchema = z.object({
	from: z.string(),
	fromTimeStamp: z.number().optional(),
	to: z.string(),
})

export type CommitRange = z.infer<typeof commitRangeSchema>

export const kiloCodeMetaDataSchema = z.object({
	commitRange: commitRangeSchema.optional(),
})

export type KiloCodeMetaData = z.infer<typeof kiloCodeMetaDataSchema>

export const fastApplyModelSchema = z.enum([
	"auto",
	"morph/morph-v3-fast",
	"morph/morph-v3-large",
	"relace/relace-apply-3",
])

export type FastApplyModel = z.infer<typeof fastApplyModelSchema>

export const fastApplyApiProviderSchema = z.enum(["current", "morph", "kilocode", "openrouter"])

export type FastApplyApiProvider = z.infer<typeof fastApplyApiProviderSchema>

// Ranger enterprise backend URL - all API calls go to this backend
// Original KiloCode default was "https://kilo.ai"
export const DEFAULT_KILOCODE_BACKEND_URL = "http://localhost:3080"

export function getKiloBaseUriFromToken(kilocodeToken?: string) {
	// For Ranger enterprise, always use the configured backend URL
	// This ignores the token's env claim since we're using our own backend
	const baseUrl = getGlobalKilocodeBackendUrl()

	// If a token is provided, we could add token validation here in the future
	// For now, just return the configured backend URL
	if (kilocodeToken) {
		try {
			const payload_string = kilocodeToken.split(".")[1]
			if (payload_string) {
				// Token exists and has a payload - use configured backend
				return baseUrl
			}
		} catch (_error) {
			console.warn("Failed to parse Kilo Code token")
		}
	}
	return baseUrl
}

/**
 * Helper function that combines token-based base URL resolution with URL construction.
 * Takes a token and a full URL, uses the token to get the appropriate base URL,
 * then constructs the final URL by replacing the domain in the target URL.
 *
 * @param targetUrl The target URL to transform
 * @param kilocodeToken The KiloCode authentication token
 * @returns Fully constructed KiloCode URL with proper backend mapping based on token
 */
export function getKiloUrlFromToken(targetUrl: string, kilocodeToken?: string): string {
	const baseUrl = getKiloBaseUriFromToken(kilocodeToken)
	const target = new URL(targetUrl)

	const { protocol, host } = new URL(baseUrl)
	Object.assign(target, { protocol, host })

	return target.toString()
}

function getGlobalKilocodeBackendUrl(): string {
	return (
		(typeof window !== "undefined" ? window.KILOCODE_BACKEND_BASE_URL : undefined) ||
		process.env.KILOCODE_BACKEND_BASE_URL ||
		DEFAULT_KILOCODE_BACKEND_URL
	)
}

/**
 * Gets the app/web URL for the current environment.
 * In development: http://localhost:3000
 * In production: https://kilo.ai
 */
export function getAppUrl(path: string = ""): string {
	return new URL(path, getGlobalKilocodeBackendUrl()).toString()
}

/**
 * Gets the API URL for the current environment.
 * Respects KILOCODE_BACKEND_BASE_URL environment variable for local development.
 * For Ranger enterprise: Uses configured backend URL directly
 */
export function getApiUrl(path: string = ""): string {
	const backend = getGlobalKilocodeBackendUrl()
	// For Ranger enterprise, always use the configured backend directly
	// No need for api subdomain separation
	return new URL(path, backend).toString()
}

/**
 * Gets the extension config URL.
 * For Ranger enterprise: Uses configured backend URL directly
 */
export function getExtensionConfigUrl(): string {
	try {
		return getAppUrl("/extension-config.json")
	} catch (error) {
		console.warn("Failed to build extension config URL:", error)
		return getAppUrl("/extension-config.json")
	}
}
