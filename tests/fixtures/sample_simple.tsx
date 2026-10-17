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

export const UserCard = <T extends UserProfile>({
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

export const AdminDashboard = (): JSX.Element => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch('/api/users')
            .then((res) => res.json())
            .then((data: UserProfile[]) => {
                setUsers(data);
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
                    <UserCard key={u.id} user={u} />
                ))}
            </div>
        </section>
    );
};

export default function App(): JSX.Element {
    return <AdminDashboard />;
}
