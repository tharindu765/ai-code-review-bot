// Test file for AI Code Review Bot
// This file intentionally contains issues for testing.

function calculateSum(numbers) {
    // BUG: No input validation
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i]; // No type checking
    }
    return sum;
}

function fetchUser(id) {
    // BUG: Using HTTP instead of HTTPS
    return fetch("http://example.com/api/user/" + id)
        .then(r => r.json())
        .catch(err => {
            console.log("Error:", err); // Bad: logs sensitive info
            return null;
        });
}

// BAD PRACTICE: Global variable
let counter = 0;

function incrementCounter() {
    counter++; // No concurrency safety
    return counter;
}

// TODO: Write documentation for this
function processData(data) {
    // Heavy nested logic for testing
    if (data && data.items) {
        return data.items
            .filter(i => i.active)
            .map(i => ({
                id: i.id,
                name: i.name.toUpperCase(), // Could throw error
                timestamp: Date.now()
            }));
    }
    return [];
}

// Trigger execution
console.log("Sum test:", calculateSum([1, 2, 3, 4]));
console.log("Counter:", incrementCounter());
console.log("Processing:", processData({ items: [{ id: 1, name: "test", active: true }] }));
