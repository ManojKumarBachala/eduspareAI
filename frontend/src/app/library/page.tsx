"use client";

import { useEffect, useState } from "react";
import api from "../../services/api";

interface Book {
    id: number;
    title: string;
    author: string;
    isbn: string;
    quantity: number;
}

export default function LibraryPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get("/books/")
            .then((res) => {
                setBooks(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-white mb-8">
                📚 Library Management
            </h1>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-500/20 backdrop-blur-xl rounded-3xl p-6 text-white">
                    <h3>Total Books</h3>
                    <h2 className="text-3xl font-bold">
                        {books.length}
                    </h2>
                </div>

                <div className="bg-green-500/20 backdrop-blur-xl rounded-3xl p-6 text-white">
                    <h3>Issued Books</h3>
                    <h2 className="text-3xl font-bold">
                        0
                    </h2>
                </div>

                <div className="bg-purple-500/20 backdrop-blur-xl rounded-3xl p-6 text-white">
                    <h3>Available Books</h3>
                    <h2 className="text-3xl font-bold">
                        {books.reduce(
                            (sum, book) => sum + book.quantity,
                            0
                        )}
                    </h2>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6">
                <h2 className="text-2xl text-white font-bold mb-6">
                    Book Inventory
                </h2>

                {loading ? (
                    <p className="text-white">
                        Loading...
                    </p>
                ) : (
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-3 text-left">ID</th>
                                <th className="p-3 text-left">Title</th>
                                <th className="p-3 text-left">Author</th>
                                <th className="p-3 text-left">ISBN</th>
                                <th className="p-3 text-left">Quantity</th>
                            </tr>
                        </thead>

                        <tbody>
                            {books.map((book) => (
                                <tr
                                    key={book.id}
                                    className="border-b border-white/10"
                                >
                                    <td className="p-3">{book.id}</td>
                                    <td className="p-3">{book.title}</td>
                                    <td className="p-3">{book.author}</td>
                                    <td className="p-3">{book.isbn}</td>
                                    <td className="p-3">{book.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}