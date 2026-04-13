const path = require('node:path');
const fs = require('node:fs');

function mergeOptions(...objects) {
	const result = {};

	objects.forEach(obj => {
		if (!obj || typeof obj !== 'object') {
			return;
		}

		Object.keys(obj).forEach(key => {
			const value = obj[key];

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				result[key] = result[key] ? mergeOptions(result[key], value) : value;
			}
			else if (value !== undefined && value !== null && value !== '') {
				result[key] = value;
			}
		});
	});

	return result;
}

function getResult(obj) {
	return {
		ENV: obj
	}
}

const configLoader = (() => {
	let cacheResult = null;

	return (options = {}) => {
		if (cacheResult && !options.path) {
			return cacheResult;
		}

		// options.path
		const normalPath = path.resolve(process.cwd(), '.pje');
		const envPath = options.path
				? path.resolve(options.path)
				: path.resolve(process.cwd(), `.${ process.env.NODE_ENV || '/' }.pje`);
		const encoding = options.encoding || 'utf-8';

		// load file(s)
		let result;

		try {
			if (options.path) {
				const content = fs.readFileSync(envPath, {encoding});
				result = getResult(JSON.parse(content));
			}
			else {
				const normal = fs.readFileSync(normalPath, {encoding});
				const env = fs.readFileSync(envPath, {encoding});

				if (normal === env) {
					result = getResult(JSON.parse(normal));
				}
				else {
					const normalObj = JSON.parse(normal);
					const envObj = JSON.parse(env);

					// merge
					const mergeEnv = mergeOptions(normalObj, envObj);

					result = getResult(mergeEnv);
				}
			}
		}
		catch (e) {
			result = {error: e};
		}

		cacheResult = result;

		return result;
	}
})();

module.exports = configLoader