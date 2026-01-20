/* eslint-disable */
/**
 * Shim for onnxruntime-node that loads native binaries from bin/ at extension root.
 *
 * This replicates what onnxruntime-node does internally, but with the correct path
 * to binaries when running from a bundled VS Code extension.
 *
 * The bin/ folder structure is copied from node_modules/onnxruntime-node/bin/
 * to the extension's bin/ folder during build.
 */
"use strict"

const path = require("path")

// __dirname in the bundled extension.js points to dist/
// The bin/ folder is copied to dist/bin/
const bindingPath = path.join(__dirname, "bin", "napi-v3", process.platform, process.arch, "onnxruntime_binding.node")

// Load the native binding
const binding = require(bindingPath)

// Create the session handler class (mirrors onnxruntime-node/dist/backend.js)
class OnnxruntimeSessionHandler {
	#inferenceSession

	constructor(pathOrBuffer, options) {
		this.#inferenceSession = new binding.InferenceSession()
		if (typeof pathOrBuffer === "string") {
			this.#inferenceSession.loadModel(pathOrBuffer, options)
		} else {
			this.#inferenceSession.loadModel(
				pathOrBuffer.buffer,
				pathOrBuffer.byteOffset,
				pathOrBuffer.byteLength,
				options,
			)
		}
		this.inputNames = this.#inferenceSession.inputNames
		this.outputNames = this.#inferenceSession.outputNames
	}

	async dispose() {
		return Promise.resolve()
	}

	startProfiling() {}
	endProfiling() {}

	async run(feeds, fetches, options) {
		return new Promise((resolve, reject) => {
			process.nextTick(() => {
				try {
					resolve(this.#inferenceSession.run(feeds, fetches, options))
				} catch (e) {
					reject(e)
				}
			})
		})
	}
}

// Create the backend (mirrors onnxruntime-node/dist/backend.js)
class OnnxruntimeBackend {
	async init() {
		return Promise.resolve()
	}

	async createSessionHandler(pathOrBuffer, options) {
		return new Promise((resolve, reject) => {
			process.nextTick(() => {
				try {
					resolve(new OnnxruntimeSessionHandler(pathOrBuffer, options || {}))
				} catch (e) {
					reject(e)
				}
			})
		})
	}
}

const onnxruntimeBackend = new OnnxruntimeBackend()

// Re-export everything from onnxruntime-common and register our backend
const onnxruntimeCommon = require("onnxruntime-common")

// Register the CPU backend with high priority (100)
onnxruntimeCommon.registerBackend("cpu", onnxruntimeBackend, 100)

// Export everything
module.exports = {
	...onnxruntimeCommon,
	binding,
	onnxruntimeBackend,
}
