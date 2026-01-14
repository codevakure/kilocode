/// <reference types="vite/client" />

declare global {
	interface Window {
		KILOCODE_BACKEND_BASE_URL: string | undefined
		PROVIDERS_ENABLED: boolean | undefined
		MCP_MARKETPLACE_ENABLED: boolean | undefined
		AGENT_MANAGER_ENABLED: boolean | undefined
		FEEDBACK_ENABLED: boolean | undefined // kilocode_change
		DOCS_BASE_URL: string | undefined
		SHOW_DOCUMENTATION_LINKS: boolean | undefined
		IMAGES_BASE_URI: string | undefined
		AUDIO_BASE_URI: string | undefined
		MATERIAL_ICONS_BASE_URI: string | undefined
	}
}

export {}
