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
    const response = await fetch(url);
    return response.json();
}

// Usage
const calc = new Calculator();
console.log(calc.add(5, 3));
console.log(calculateSum(10, 20));
