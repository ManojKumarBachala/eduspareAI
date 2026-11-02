"use client";

import { useEffect, useState } from "react";
import { getStudents } from "../services/studentService";
import { Student } from "../types/student";


export default function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStudents()
            .then(setStudents)
            .finally(() => setLoading(false));
    }, []);

    return {
        students,
        loading,
        setStudents,
    };
}