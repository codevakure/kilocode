import path from "path"
import { EmbedderInfo, EmbeddingResponse, IEmbedder } from "../interfaces"
import { withValidationErrorHandling, sanitizeErrorMessage } from "../shared/validation-helpers"
import { TelemetryService } from "@roo-code/telemetry"
import { TelemetryEventName } from "@roo-code/types"

// Import types for Transformers.js
type FeatureExtractionPipeline = any

// Singleton pipeline instance - shared across all LocalEmbedder instances
let pipelineInstance: FeatureExtractionPipeline | null = null
let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null
let isModelLoaded = false

/**
 * Default model configuration - optimized for 8GB RAM laptops
 * all-MiniLM-L6-v2: ~90MB download, ~100-200MB RAM, very fast
 */
const DEFAULT_MODEL = {
	id: "all-MiniLM-L6-v2",
	huggingFaceId: "Xenova/all-MiniLM-L6-v2",
	dimension: 384,
} as const

/**
 * Implements the IEmbedder interface using @xenova/transformers with native onnxruntime-node.
 *
 * Uses native CPU acceleration for fast embedding generation.
 * Models download on first use from HuggingFace Hub and are cached locally.
 */
export class LocalEmbedder implements IEmbedder {
	constructor(_modelId?: string) {
		// We only support one model now for simplicity
		// The modelId parameter is kept for API compatibility but ignored
	}

	/**
	 * Lazily initializes the Transformers.js pipeline.
	 * Downloads model on first use (~90MB), then loads from cache.
	 */
	private async initializePipeline(): Promise<FeatureExtractionPipeline> {
		// Return existing instance if already loaded
		if (pipelineInstance) {
			return pipelineInstance
		}

		// Return pending promise if initialization is in progress
		if (pipelinePromise) {
			return pipelinePromise
		}

		console.log(`[LocalEmbedder] Initializing local embedding model: ${DEFAULT_MODEL.huggingFaceId}`)
		console.log(`[LocalEmbedder] First run will download ~90MB model (cached for future use)`)

		pipelinePromise = (async () => {
			try {
				// Import @xenova/transformers - uses native onnxruntime-node for performance
				const { pipeline, env } = await import("@xenova/transformers")

				// Configure for local model caching
				env.allowLocalModels = true
				env.allowRemoteModels = true // Download from HuggingFace Hub on first use

				// Set cache directory for models
				const cacheDir = path.join(
					process.env.HOME || process.env.USERPROFILE || ".",
					".cache",
					"huggingface",
					"transformers",
				)
				env.cacheDir = cacheDir

				console.log(`[LocalEmbedder] Model cache directory: ${cacheDir}`)

				// Create the feature extraction pipeline
				const pipe = await pipeline("feature-extraction", DEFAULT_MODEL.huggingFaceId)

				pipelineInstance = pipe
				isModelLoaded = true
				console.log(`[LocalEmbedder] Model loaded successfully`)

				return pipe
			} catch (error) {
				pipelinePromise = null
				pipelineInstance = null
				isModelLoaded = false
				throw error
			}
		})()

		return pipelinePromise
	}

	/**
	 * Creates embeddings for the given texts using the local model.
	 * @param texts - An array of strings to embed.
	 * @param _model - Ignored (we use a single optimized model).
	 * @returns A promise that resolves to an EmbeddingResponse containing the embeddings.
	 */
	async createEmbeddings(texts: string[], _model?: string): Promise<EmbeddingResponse> {
		try {
			// Initialize or get the pipeline
			const pipe = await this.initializePipeline()

			// Process texts in batches to avoid memory issues on low-RAM machines
			const batchSize = 16 // Smaller batches for 8GB RAM
			const allEmbeddings: number[][] = []

			for (let i = 0; i < texts.length; i += batchSize) {
				const batch = texts.slice(i, i + batchSize)

				// Generate embeddings for the batch
				const results = await pipe(batch, {
					pooling: "mean",
					normalize: true,
				})

				// Extract embeddings from results
				for (let j = 0; j < batch.length; j++) {
					const embedding = results[j].tolist()
					allEmbeddings.push(embedding)
				}
			}

			// Estimate tokens (rough approximation: ~4 chars per token)
			const totalChars = texts.reduce((sum, text) => sum + text.length, 0)
			const estimatedTokens = Math.ceil(totalChars / 4)

			return {
				embeddings: allEmbeddings,
				usage: {
					promptTokens: estimatedTokens,
					totalTokens: estimatedTokens,
				},
			}
		} catch (error: any) {
			// Capture telemetry
			TelemetryService.instance.captureEvent(TelemetryEventName.CODE_INDEX_ERROR, {
				error: sanitizeErrorMessage(error instanceof Error ? error.message : String(error)),
				stack: error instanceof Error ? sanitizeErrorMessage(error.stack || "") : undefined,
				location: "LocalEmbedder:createEmbeddings",
			})

			console.error("[LocalEmbedder] Embedding failed:", error)

			// Provide helpful error messages
			if (error.message?.includes("Could not locate file")) {
				throw new Error(
					`Local embedding model not found. The model will be downloaded automatically on first use. ` +
						`Please ensure you have internet access for the initial download (~90MB).`,
				)
			}

			throw new Error(`Local embedding failed: ${error.message}`)
		}
	}

	/**
	 * Validates the local embedder by checking if the model can be loaded.
	 * @returns Promise resolving to validation result.
	 */
	async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
		return withValidationErrorHandling(async () => {
			try {
				// Try to initialize the pipeline
				await this.initializePipeline()

				// Test with a simple embedding
				const testResult = await this.createEmbeddings(["test"])

				if (!testResult.embeddings || testResult.embeddings.length === 0) {
					return {
						valid: false,
						error: "Local embedding model returned empty results",
					}
				}

				if (testResult.embeddings[0].length !== DEFAULT_MODEL.dimension) {
					return {
						valid: false,
						error: `Unexpected embedding dimension: got ${testResult.embeddings[0].length}, expected ${DEFAULT_MODEL.dimension}`,
					}
				}

				return { valid: true }
			} catch (error: any) {
				return {
					valid: false,
					error: error.message || "Failed to initialize local embedding model",
				}
			}
		}, "LocalEmbedder:validateConfiguration")
	}

	/**
	 * Returns information about this embedder.
	 */
	get embedderInfo(): EmbedderInfo {
		return {
			name: "local",
		}
	}

	/**
	 * Gets the dimension for the local model (384 for all-MiniLM-L6-v2).
	 */
	static getModelDimension(): number {
		return DEFAULT_MODEL.dimension
	}

	/**
	 * Checks if the model is already loaded.
	 */
	static isLoaded(): boolean {
		return isModelLoaded
	}
}
