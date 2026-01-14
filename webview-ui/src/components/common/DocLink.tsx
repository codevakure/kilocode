import React from "react"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { shouldShowDocLinks, buildDocLink } from "@src/utils/docLinks"

interface DocLinkProps {
	/** Documentation path (without leading slash) */
	path: string
	/** UTM campaign for analytics */
	campaign: string
	/** Link text/content */
	children: React.ReactNode
	/** Additional class names */
	className?: string
	/** Additional inline styles */
	style?: React.CSSProperties
	/** Aria label for accessibility */
	"aria-label"?: string
}

/**
 * A documentation link component that:
 * 1. Uses configurable DOCS_BASE_URL from environment
 * 2. Conditionally renders based on SHOW_DOCUMENTATION_LINKS flag
 *
 * When SHOW_DOCUMENTATION_LINKS is false, returns null (hidden)
 * When true, renders a VSCodeLink to the documentation
 */
export const DocLink: React.FC<DocLinkProps> = ({
	path,
	campaign,
	children,
	className,
	style,
	"aria-label": ariaLabel,
}) => {
	if (!shouldShowDocLinks()) {
		return null
	}

	const href = buildDocLink(path, campaign)

	return (
		<VSCodeLink href={href} className={className} style={style} aria-label={ariaLabel}>
			{children}
		</VSCodeLink>
	)
}

/**
 * A simple wrapper that conditionally renders its children based on SHOW_DOCUMENTATION_LINKS flag.
 * Useful for wrapping existing documentation-related elements that shouldn't use DocLink directly.
 */
export const DocLinkContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	if (!shouldShowDocLinks()) {
		return null
	}
	return <>{children}</>
}

export default DocLink
