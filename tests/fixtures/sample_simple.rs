use std::collections::HashMap;
use std::fmt::Display;

pub const DEFAULT_MAX: i32 = 1000;
pub static APP_NAME: &str = "CalculatorApp";

#[derive(Debug, Clone, PartialEq)]
pub enum Operation {
    Add,
    Subtract,
    Multiply,
}

pub trait MathOperations {
    fn calculate(&self, op: Operation, a: i32, b: i32) -> i32;
    fn reset(&mut self);
}

pub struct Calculator {
    pub result: i32,
    history: Vec<i32>,
}

impl Calculator {
    pub fn new() -> Self {
        Self {
            result: 0,
            history: Vec::new(),
        }
    }

    pub fn add(&mut self, a: i32, b: i32) -> i32 {
        self.result = a + b;
        self.history.push(self.result);
        self.result
    }

    pub fn subtract(&mut self, a: i32, b: i32) -> i32 {
        self.result = a - b;
        self.history.push(self.result);
        self.result
    }

    pub fn get_result(&self) -> i32 {
        self.result
    }
}

impl MathOperations for Calculator {
    fn calculate(&self, op: Operation, a: i32, b: i32) -> i32 {
        match op {
            Operation::Add => a + b,
            Operation::Subtract => a - b,
            Operation::Multiply => a * b,
        }
    }

    fn reset(&mut self) {
        self.result = 0;
        self.history.clear();
    }
}

pub mod utils {
    pub fn clamp(val: i32, min: i32, max: i32) -> i32 {
        if val < min {
            min
        } else if val > max {
            max
        } else {
            val
        }
    }
}

pub fn create_default_calculator() -> Calculator {
    Calculator::new()
}
