#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
    getModelTypeValidationError,
    getReleaseMonthValidationError,
    isGithubRepositoryUrl
} = require('./model-metadata.js');

const rootDir = path.resolve(__dirname, '..');
const resultsDir = path.join(rootDir, 'data', 'results');
const tasksDir = path.join(rootDir, 'data', 'tasks');
const modelIdPattern = /^[a-z0-9][a-z0-9._-]*$/;

const errors = [];
const warnings = [];

function relativePath(filePath) {
    return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}

function escapeAnnotation(value) {
    return String(value)
        .replaceAll('%', '%25')
        .replaceAll('\r', '%0D')
        .replaceAll('\n', '%0A')
        .replaceAll(':', '%3A')
        .replaceAll(',', '%2C');
}

function addIssue(collection, level, filePath, message) {
    collection.push({ filePath, message });
    const file = filePath ? ` file=${escapeAnnotation(relativePath(filePath))},` : '';
    console.log(`::${level}${file}::${escapeAnnotation(message)}`);
}

function addError(filePath, message) {
    addIssue(errors, 'error', filePath, message);
}

function addWarning(filePath, message) {
    addIssue(warnings, 'warning', filePath, message);
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        addError(filePath, `Invalid JSON: ${error.message}`);
        return undefined;
    }
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function validateNumberArray(filePath, label, value, { min, max } = {}) {
    if (!Array.isArray(value) || value.length !== 3) {
        addError(filePath, `${label} must be an array with exactly 3 numbers`);
        return;
    }

    value.forEach((entry, index) => {
        if (typeof entry !== 'number' || !Number.isFinite(entry)) {
            addError(filePath, `${label}[${index}] must be a finite number`);
            return;
        }
        if (min !== undefined && entry < min) {
            addError(filePath, `${label}[${index}] must be >= ${min}`);
        }
        if (max !== undefined && entry > max) {
            addError(filePath, `${label}[${index}] must be <= ${max}`);
        }
    });
}

function loadCanonicalTasks() {
    const taskListPath = path.join(tasksDir, 'tasks.json');
    const taskIds = readJson(taskListPath);
    const tasksByName = new Map();

    if (!Array.isArray(taskIds)) {
        addError(taskListPath, 'data/tasks/tasks.json must be an array of task IDs');
        return tasksByName;
    }

    const seenTaskIds = new Set();
    for (const taskId of taskIds) {
        if (!isNonEmptyString(taskId)) {
            addError(taskListPath, 'Each task ID must be a non-empty string');
            continue;
        }
        if (seenTaskIds.has(taskId)) {
            addError(taskListPath, `Duplicate task ID in tasks.json: ${taskId}`);
            continue;
        }
        seenTaskIds.add(taskId);

        const taskPath = path.join(tasksDir, `${taskId}.json`);
        if (!fs.existsSync(taskPath)) {
            addError(taskListPath, `Task "${taskId}" is listed but data/tasks/${taskId}.json does not exist`);
            continue;
        }

        const task = readJson(taskPath);
        if (!isPlainObject(task)) {
            addError(taskPath, 'Task file must contain a JSON object');
            continue;
        }
        if (task.id !== taskId) {
            addError(taskPath, `Task id must match filename: expected "${taskId}", found "${task.id}"`);
        }
        if (!isNonEmptyString(task.name)) {
            addError(taskPath, 'Task name must be a non-empty string');
            continue;
        }
        if (tasksByName.has(task.name)) {
            addError(taskPath, `Duplicate task name in canonical task list: ${task.name}`);
            continue;
        }

        tasksByName.set(task.name, {
            id: taskId,
            name: task.name,
            category: task.category
        });
    }

    return tasksByName;
}

function loadModelIds() {
    const manifestPath = path.join(resultsDir, 'models.json');
    const manifest = readJson(manifestPath);
    const modelIds = [];

    if (!isPlainObject(manifest) || !Array.isArray(manifest.models)) {
        addError(manifestPath, 'data/results/models.json must be an object with a "models" array');
        return modelIds;
    }

    const seenModelIds = new Set();
    manifest.models.forEach((modelId, index) => {
        if (!isNonEmptyString(modelId)) {
            addError(manifestPath, `models[${index}] must be a non-empty string`);
            return;
        }
        if (modelId !== modelId.trim()) {
            addError(manifestPath, `models[${index}] must not contain leading or trailing whitespace`);
            return;
        }
        if (!modelIdPattern.test(modelId)) {
            addError(manifestPath, `Invalid model ID "${modelId}". Use lowercase letters, numbers, dots, underscores, and hyphens`);
            return;
        }
        if (seenModelIds.has(modelId)) {
            addError(manifestPath, `Duplicate model ID in models.json: ${modelId}`);
            return;
        }

        seenModelIds.add(modelId);
        modelIds.push(modelId);
    });

    return modelIds;
}

function validateManifestFiles(modelIds) {
    const manifestPath = path.join(resultsDir, 'models.json');
    const registeredIds = new Set(modelIds);

    for (const modelId of modelIds) {
        const modelPath = path.join(resultsDir, `${modelId}.json`);
        if (!fs.existsSync(modelPath)) {
            addError(manifestPath, `Model "${modelId}" is listed but data/results/${modelId}.json does not exist`);
        }
    }

    const resultFiles = fs.readdirSync(resultsDir)
        .filter(fileName => fileName.endsWith('.json'))
        .filter(fileName => fileName !== 'models.json')
        .filter(fileName => fileName !== 'vla-arena-data.json');

    for (const fileName of resultFiles) {
        const fileId = fileName.replace(/\.json$/, '');
        if (!registeredIds.has(fileId)) {
            addError(path.join(resultsDir, fileName), `Result file is not registered in data/results/models.json: ${fileId}`);
        }
    }
}

function validateModelFile(modelId, canonicalTasks) {
    const modelPath = path.join(resultsDir, `${modelId}.json`);
    if (!fs.existsSync(modelPath)) {
        return;
    }

    const model = readJson(modelPath);
    if (!isPlainObject(model)) {
        addError(modelPath, 'Model result file must contain a JSON object');
        return;
    }

    if (Object.prototype.hasOwnProperty.call(model, 'id')) {
        addError(modelPath, 'Top-level "id" is not allowed; model ID comes from the filename and data/results/models.json');
    }

    if (!isNonEmptyString(model.name)) {
        addError(modelPath, 'Model "name" must be a non-empty string');
    }

    if (Object.prototype.hasOwnProperty.call(model, 'size')) {
        if (!isNonEmptyString(model.size)) {
            addError(modelPath, 'Model "size" must be a non-empty string when present');
        } else if (model.size !== model.size.trim()) {
            addError(modelPath, 'Model "size" must not contain leading or trailing whitespace');
        }
    }

    if (Object.prototype.hasOwnProperty.call(model, 'modelType')) {
        const modelTypeError = getModelTypeValidationError(model.modelType);
        if (modelTypeError) {
            addError(modelPath, modelTypeError);
        }
    }

    if (Object.prototype.hasOwnProperty.call(model, 'releaseMonth')) {
        const releaseMonthError = getReleaseMonthValidationError(model.releaseMonth);
        if (releaseMonthError) {
            addError(modelPath, releaseMonthError);
        }
    }

    if (Object.prototype.hasOwnProperty.call(model, 'links')) {
        if (!isPlainObject(model.links)) {
            addError(modelPath, 'Model "links" must be a JSON object when present');
        } else {
            ['arena', 'paper', 'huggingface', 'github'].forEach(key => {
                if (!Object.prototype.hasOwnProperty.call(model.links, key)) {
                    return;
                }

                const value = model.links[key];
                if (!isNonEmptyString(value)) {
                    addError(modelPath, `Model "links.${key}" must be a non-empty string when present`);
                } else if (value !== value.trim()) {
                    addError(modelPath, `Model "links.${key}" must not contain leading or trailing whitespace`);
                } else if (!isHttpUrl(value)) {
                    addError(modelPath, `Model "links.${key}" must be an http(s) URL`);
                } else if (key === 'github' && !isGithubRepositoryUrl(value)) {
                    addError(modelPath, 'Model "links.github" must be an https://github.com/<owner>/<repository> URL');
                }
            });
        }
    }

    if (!Array.isArray(model.tasks)) {
        addError(modelPath, 'Model "tasks" must be an array');
        return;
    }

    const seenTaskNames = new Set();
    model.tasks.forEach((task, index) => {
        const taskLabel = `tasks[${index}]`;
        if (!isPlainObject(task)) {
            addError(modelPath, `${taskLabel} must be a JSON object`);
            return;
        }

        if (!isNonEmptyString(task.name)) {
            addError(modelPath, `${taskLabel}.name must be a non-empty string`);
            return;
        }

        if (seenTaskNames.has(task.name)) {
            addError(modelPath, `Duplicate task in model result: ${task.name}`);
        }
        seenTaskNames.add(task.name);

        const canonicalTask = canonicalTasks.get(task.name);
        if (!canonicalTask) {
            addError(modelPath, `Unknown task name: ${task.name}`);
        }

        if (!isNonEmptyString(task.category)) {
            addError(modelPath, `${taskLabel}.category must be a non-empty string`);
        } else if (canonicalTask && task.category !== canonicalTask.category) {
            addError(modelPath, `${task.name} category must be "${canonicalTask.category}", found "${task.category}"`);
        }

        if (typeof task.hasCC !== 'boolean') {
            addError(modelPath, `${taskLabel}.hasCC must be boolean`);
        } else if (canonicalTask) {
            const expectedHasCC = canonicalTask.category === 'Safety';
            if (task.hasCC !== expectedHasCC) {
                addError(modelPath, `${task.name} hasCC must be ${expectedHasCC} for category "${canonicalTask.category}"`);
            }
        }

        if (!isPlainObject(task.data)) {
            addError(modelPath, `${taskLabel}.data must be a JSON object`);
            return;
        }

        validateNumberArray(modelPath, `${task.name}.data.sr`, task.data.sr, { min: 0, max: 1 });

        if (task.hasCC) {
            validateNumberArray(modelPath, `${task.name}.data.cc`, task.data.cc);
        } else if (Object.prototype.hasOwnProperty.call(task.data, 'cc')) {
            addWarning(modelPath, `${task.name}.data.cc is ignored because hasCC is false`);
        }
    });
}

const canonicalTasks = loadCanonicalTasks();
const modelIds = loadModelIds();
validateManifestFiles(modelIds);
modelIds.forEach(modelId => validateModelFile(modelId, canonicalTasks));

console.log('');
console.log(`Validated ${modelIds.length} model result files against ${canonicalTasks.size} canonical tasks.`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length > 0) {
    process.exit(1);
}
