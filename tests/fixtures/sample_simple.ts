// Simple TypeScript example
interface ICalculator {
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
}

class Calculator implements ICalculator {
    private result: number = 0;

    add(a: number, b: number): number {
        this.result = a + b;
        return this.result;
    }

    subtract(a: number, b: number): number {
        this.result = a - b;
        return this.result;
    }

    getResult(): number {
        return this.result;
    }
}

async function fetchUserData(userId: string): Promise<any> {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
}

export { Calculator, fetchUserData };
