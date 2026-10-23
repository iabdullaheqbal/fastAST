// Sample React JSX component for FastAST
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const todoHeader = ({ title }) => {
    return (
        <header className="todo-header">
            <h1>{title}</h1>
        </header>
    );
};

export function todoItem({ todo, onToggle, onDelete }) {
    return (
        <li className={todo.completed ? 'completed' : ''}>
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggle(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => onDelete(todo.id)}>Delete</button>
        </li>
    );
}

export default class TodoApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            todos: [],
            inputText: '',
        };
    }

    componentDidMount() {
        this.loadStoredTodos();
    }

    loadStoredTodos() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            this.setState({ todos: JSON.parse(stored) });
        }
    }

    addTodo(text) {
        const newTodo = { id: Date.now(), text, completed: false };
        this.setState(prev => ({ todos: [...prev.todos, newTodo] }));
    }

    render() {
        return (
            <div className="todo-app">
                <todoHeader title="FastAST Task List" />
                <ul className="todo-list">
                    {this.state.todos.map(t => (
                        <todoItem
                            key={t.id}
                            todo={t}
                            onToggle={this.toggleTodo}
                            onDelete={this.deleteTodo}
                        />
                    ))}
                </ul>
            </div>
        );
    }
}

