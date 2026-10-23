import React, { useState, useEffect } from 'react';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
}

export interface UserCardProps<T extends UserProfile> {
    user: T;
    onEdit?: (user: T) => void;
    onDelete?: (id: string) => Promise<void>;
}

export const userCard = <T extends UserProfile>({
    user,
    onEdit,
    onDelete,
}: UserCardProps<T>): JSX.Element => {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    return (
        <div
            className={`user-card ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <span className="badge">{user.role}</span>
            {onEdit && (
                <button onClick={() => onEdit(user)}>Edit Profile</button>
            )}
        </div>
    );
};

export const adminDashboard = (): JSX.Element => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('/api/users')
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error: ${res.status}`);
                }
                return res.json();
            })
            .then((data: UserProfile[]) => {
                setUsers(data);
                setLoading(false);
            })
            .catch((err: Error) => {
                console.error("Failed to load users:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="spinner">Loading users...</div>;
    }

    return (
        <section className="dashboard">
            <h1>User Management</h1>
            <div className="grid">
                {users.map((u) => (
                    <userCard key={u.id} user={u} />
                ))}
            </div>
        </section>
    );
};

export default function renderApp(): JSX.Element {
    return <adminDashboard />;
}

