"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // returns distance in meters
}

export default function AdminPage() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAttendanceData();
    }, [selectedDate]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            let query = supabase.from("attendance").select("*");

            if (selectedDate) {
                // Filter for selected date (comparing just the date part of timestamp)
                query = query
                    .filter("timestamp", "gte", `${selectedDate}T00:00:00`)
                    .filter("timestamp", "lt", `${selectedDate}T23:59:59`);
            }

            const { data, error } = await query.order("timestamp", {
                ascending: false,
            });

            if (error) throw error;
            setAttendanceData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (attendanceData.length === 0) return;

        // Remove "Present" from headers
        const headers = ["Name", "Email", "HUID", "Timestamp", "Distance"];

        // Convert data to CSV format
        const csvData = attendanceData.map((record) => {
            // Remove the "Present" value
            const values = [
                `"${record.name}"`,
                `"${record.email}"`,
                `"${record.huid}"`,
                `"${new Date(record.timestamp).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })}"`,
                `"${calculateDistance(
                    record.lat,
                    record.long,
                    42.37718594957353,
                    -71.11540116881643
                ).toFixed(0)}m"`,
            ];
            return values;
        });

        // Combine headers and data
        const csvContent = [
            headers.map((header) => `"${header}"`).join(","),
            ...csvData.map((row) => row.join(",")),
        ].join("\n");

        // Create and trigger download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedDate || "all"}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
                    ES139 Attendance Dashboard
                </h1>

                <div className="mb-6 flex gap-4 items-center">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 border rounded-lg text-black"
                    />
                    <button
                        onClick={downloadCSV}
                        disabled={attendanceData.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        Download CSV
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : error ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                        {error}
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-lg">
                            Total Attendance: {attendanceData.length}
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                HUID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {attendanceData.map((record, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                                    {record.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                                    {record.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                                    {record.huid}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                                                    {new Date(
                                                        record.timestamp
                                                    ).toLocaleString("en-US", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
