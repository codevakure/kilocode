/**
 * Shim for sharp to satisfy @xenova/transformers import
 *
 * sharp is an optional dependency used for image processing.
 * Since we're only doing text embeddings (not image processing),
 * we don't need the actual sharp functionality.
 *
 * This shim provides stub exports to satisfy the import.
 */

// Export a function that throws if actually called
const sharp = () => {
	throw new Error("sharp is not available in VS Code extension context. Image processing is not supported.")
}

// Add common sharp methods as stubs
sharp.cache = () => {}
sharp.concurrency = () => {}
sharp.counters = () => ({})
sharp.simd = () => false
sharp.versions = {}

// Default export
export default sharp
