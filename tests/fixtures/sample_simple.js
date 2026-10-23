// Simple JavaScript example
class Calculator {
    constructor() {
        this.result = 0;
    }

    add(a, b) {
        this.result = a + b;
        return this.result;
    }

    subtract(a, b) {
        this.result = a - b;
        return this.result;
    }

    getResult() {
        return this.result;
    }
}

function calculateSum(a, b) {
    return a + b;
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch failed:", error);
        throw error;
    }
}

// Usage
const calc = new Calculator();
console.log(calc.add(5, 3));
console.log(calculateSum(10, 20));
