const binaryArrayInput = document.getElementById('binary-array');
const binaryTargetInput = document.getElementById('binary-target');
const binaryRunButton = document.getElementById('binary-run');
const binaryResetButton = document.getElementById('binary-reset');
const binaryStatus = document.getElementById('binary-status');
const binaryVisual = document.getElementById('binary-visual');
const binaryMemory = document.getElementById('binary-memory');
const binaryTrace = document.getElementById('binary-trace');

const waterArrayInput = document.getElementById('water-array');
const waterRunButton = document.getElementById('water-run');
const waterResetButton = document.getElementById('water-reset');
const waterStatus = document.getElementById('water-status');
const waterVisual = document.getElementById('water-visual');
const waterMemory = document.getElementById('water-memory');
const waterTrace = document.getElementById('water-trace');

const defaultBinary = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const defaultWater = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];

function parseArray(value) {
    return value
        .split(',')
        .map((text) => text.trim())
        .filter((text) => text.length)
        .map(Number)
        .filter((num) => !Number.isNaN(num));
}

function renderBars(container, values, options = {}) {
    if (!container) return;
    container.innerHTML = '';
    const max = Math.max(...values, 1);
    const scale = 140 / max;

    values.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${Math.max(20, value * scale)}px`;
        bar.innerHTML = `<span>${value}</span>`;
        if (options.classes && options.classes[index]) {
            bar.classList.add(...options.classes[index]);
        }
        if (options.labels && options.labels[index]) {
            bar.dataset.label = options.labels[index];
            bar.classList.add(options.labels[index].includes('left') ? 'left-pointer' : 'right-pointer');
        }
        if (options.water && options.water[index] != null) {
            bar.classList.add('water');
            bar.style.setProperty('--water-height', `${options.water[index] * scale}px`);
            bar.querySelector('span').textContent = `${value}\n(${options.water[index]})`;
            bar.style.whiteSpace = 'pre';
        }
        container.appendChild(bar);
    });
}

function renderMemoryPanel(container, blocks) {
    if (!container) return;
    container.innerHTML = '';
    blocks.forEach((block) => {
        const cell = document.createElement('div');
        cell.className = 'memory-cell';
        if (block.active) {
            cell.classList.add('active');
        }
        cell.innerHTML = `
            <div class="memory-value">${block.value}</div>
            <div class="memory-address">${block.label}</div>
            ${block.note ? `<div class="memory-note">${block.note}</div>` : ''}
        `;
        container.appendChild(cell);
    });
}

function renderTrace(container, entries) {
    if (!container) return;
    container.innerHTML = '';
    entries.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'trace-entry';
        row.textContent = entry;
        container.appendChild(row);
    });
}

function setStatus(el, message) {
    if (!el) return;
    el.textContent = message;
}

function animateSteps(steps, renderStep, done) {
    let i = 0;
    function next() {
        if (i >= steps.length) {
            done?.();
            return;
        }
        renderStep(steps[i], i);
        i += 1;
        setTimeout(next, 650);
    }
    next();
}

function buildMemoryBlocks(arr, step) {
    return arr.map((value, index) => {
        const labels = [];
        if (index === step.low) labels.push('low');
        if (index === step.mid) labels.push('mid');
        if (index === step.high) labels.push('high');
        return {
            value,
            label: `addr ${index}`,
            active: index === step.low || index === step.mid || index === step.high,
            note: labels.length ? labels.join(', ') : '',
        };
    });
}

function visualizeBinarySearch() {
    if (!binaryArrayInput || !binaryTargetInput || !binaryStatus || !binaryVisual) return;

    const arr = parseArray(binaryArrayInput.value);
    const target = Number(binaryTargetInput.value);
    if (!arr.length || Number.isNaN(target)) {
        setStatus(binaryStatus, 'Enter a valid sorted array and target.');
        return;
    }

    const sorted = [...arr].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(arr)) {
        setStatus(binaryStatus, 'Array was not sorted. Sorting for visualization.');
    } else {
        setStatus(binaryStatus, 'Running binary search...');
    }

    const steps = [];
    let low = 0;
    let high = arr.length - 1;
    let foundIndex = -1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        steps.push({ low, mid, high, found: false, target, message: `Compare arr[${mid}] = ${arr[mid]} with target ${target}.` });
        if (arr[mid] === target) {
            foundIndex = mid;
            steps.push({ low, mid, high, found: true, target, message: `Found the target at mid = ${mid}.` });
            break;
        }
        if (arr[mid] < target) {
            steps.push({ low, mid, high, found: false, target, message: `Value is smaller than target, move low to mid + 1.` });
            low = mid + 1;
        } else {
            steps.push({ low, mid, high, found: false, target, message: `Value is greater than target, move high to mid - 1.` });
            high = mid - 1;
        }
    }

    if (foundIndex === -1) {
        steps.push({ low: null, mid: null, high: null, found: false, target, ended: true, message: 'Search interval is empty, target not found.' });
    }

    const traceEntries = [];
    animateSteps(
        steps,
        (step, index) => {
            const classes = arr.map((_, idx) => {
                const row = [];
                if (idx === step.low) row.push('low');
                if (idx === step.high) row.push('high');
                if (idx === step.mid) row.push('mid');
                if (step.found && idx === step.mid) row.push('found');
                return row;
            });

            renderBars(binaryVisual, arr, { classes });
            renderMemoryPanel(binaryMemory, buildMemoryBlocks(arr, step));
            traceEntries.push(`${index + 1}. ${step.message}`);
            renderTrace(binaryTrace, traceEntries.slice(-10));

            if (step.ended) {
                setStatus(binaryStatus, `Value ${target} not found.`);
            } else if (step.found) {
                setStatus(binaryStatus, `Found ${target} at index ${step.mid}.`);
            } else {
                setStatus(binaryStatus, `Checking mid=${step.mid}. low=${step.low}, high=${step.high}`);
            }
        },
        () => {
            if (steps.length && !steps[steps.length - 1].found && !steps[steps.length - 1].ended) {
                setStatus(binaryStatus, `Value ${target} not found.`);
            }
        }
    );
}

function visualizeTrappingRainWater() {
    if (!waterArrayInput || !waterStatus || !waterVisual) return;

    const heights = parseArray(waterArrayInput.value);
    if (!heights.length) {
        setStatus(waterStatus, 'Enter a valid height map.');
        return;
    }
    setStatus(waterStatus, 'Running rain water trap algorithm...');

    const steps = [];
    let left = 0;
    let right = heights.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    const water = Array(heights.length).fill(0);
    const traceEntries = [];

    while (left <= right) {
        steps.push({ left, right, leftMax, rightMax, water: water.slice(), heights: heights.slice(), message: `Inspect positions left=${left} and right=${right}.` });
        if (heights[left] <= heights[right]) {
            if (heights[left] >= leftMax) {
                leftMax = heights[left];
                traceEntries.push(`left=${left}: new leftMax = ${leftMax}`);
            } else {
                water[left] = leftMax - heights[left];
                traceEntries.push(`left=${left}: trapped ${water[left]} units of water.`);
            }
            left += 1;
        } else {
            if (heights[right] >= rightMax) {
                rightMax = heights[right];
                traceEntries.push(`right=${right}: new rightMax = ${rightMax}`);
            } else {
                water[right] = rightMax - heights[right];
                traceEntries.push(`right=${right}: trapped ${water[right]} units of water.`);
            }
            right -= 1;
        }
    }
    steps.push({ left: null, right: null, leftMax, rightMax, water: water.slice(), heights: heights.slice(), done: true, message: 'Completed the water trapping algorithm.' });

    animateSteps(
        steps,
        (step, index) => {
            const labels = heights.map((_, idx) => {
                if (idx === step.left) return 'left';
                if (idx === step.right) return 'right';
                return '';
            });
            const classes = heights.map((_, idx) => {
                const row = [];
                if (idx === step.left) row.push('left-pointer');
                if (idx === step.right) row.push('right-pointer');
                return row;
            });
            renderBars(waterVisual, heights, { classes, labels, water: step.water });
            renderMemoryPanel(
                waterMemory,
                heights.map((height, idx) => ({
                    value: `${height} + ${step.water[idx] || 0}`,
                    label: `addr ${idx}`,
                    active: idx === step.left || idx === step.right,
                    note: idx === step.left ? 'left pointer' : idx === step.right ? 'right pointer' : '',
                }))
            );
            if (step.message) {
                traceEntries.push(`${index + 1}. ${step.message}`);
            }
            renderTrace(waterTrace, traceEntries.slice(-10));

            if (step.done) {
                const total = step.water.reduce((sum, value) => sum + value, 0);
                setStatus(waterStatus, `Total trapped water = ${total}`);
            } else {
                setStatus(waterStatus, `left=${step.left}, right=${step.right}, leftMax=${step.leftMax}, rightMax=${step.rightMax}`);
            }
        },
        () => {
            // no-op
        }
    );
}

function resetBinary() {
    if (!binaryVisual || !binaryStatus) return;
    renderBars(binaryVisual, defaultBinary);
    renderMemoryPanel(binaryMemory, defaultBinary.map((value, idx) => ({ value, label: `addr ${idx}`, active: false })));
    renderTrace(binaryTrace, ['Ready to run binary search.']);
    setStatus(binaryStatus, 'Ready.');
}

function resetWater() {
    if (!waterVisual || !waterStatus) return;
    renderBars(waterVisual, defaultWater);
    renderMemoryPanel(waterMemory, defaultWater.map((value, idx) => ({ value, label: `addr ${idx}`, active: false })));
    renderTrace(waterTrace, ['Ready to run trapping rain water.']);
    setStatus(waterStatus, 'Ready.');
}

if (binaryRunButton) {
    binaryRunButton.addEventListener('click', visualizeBinarySearch);
}
if (binaryResetButton) {
    binaryResetButton.addEventListener('click', resetBinary);
}
if (waterRunButton) {
    waterRunButton.addEventListener('click', visualizeTrappingRainWater);
}
if (waterResetButton) {
    waterResetButton.addEventListener('click', resetWater);
}

resetBinary();
resetWater();
