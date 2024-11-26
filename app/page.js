"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

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

    return R * c; // Distance in meters
}

export default function Home() {
    const [formData, setFormData] = useState({
        email: "",
        huid: "",
        name: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [gpsPermission, setGpsPermission] = useState(false);

    useEffect(() => {
        checkGPSPermission();
    }, []);

    const checkGPSPermission = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => setGpsPermission(true),
                () => setGpsPermission(false)
            );
        } else {
            setGpsPermission(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (!gpsPermission) {
            setMessage("Error: GPS permission is required");
            setLoading(false);
            return;
        }

        try {
            // Get GPS location
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                });
            });

            // Calculate distance from target location
            const targetLat = 42.37718594957353;
            const targetLong = -71.11540116881643;
            const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                targetLat,
                targetLong
            );

            // Get IP address
            const ipResponse = await fetch("https://api.ipify.org?format=json");
            const ipData = await ipResponse.json();

            const attendanceData = {
                email: formData.email,
                huid: formData.huid,
                name: formData.name,
                lat: position.coords.latitude,
                long: position.coords.longitude,
                ip_address: ipData.ip,
                timestamp: new Date().toISOString(),
                is_present: distance <= 300, // true if within 300 meters
            };

            const { error } = await supabase
                .from("attendance")
                .insert([attendanceData]);

            if (error) throw error;

            // Update success message to include distance information
            setMessage(
                `Attendance recorded. ${
                    distance <= 300
                        ? `You are within range (${Math.round(distance)}m)`
                        : `But you are too far (${Math.round(distance)}m)`
                }`
            );
            setFormData({ email: "", huid: "", name: "" });
        } catch (error) {
            setMessage(
                "Error: " + (error.message || "Failed to record attendance")
            );
            console.error("Attendance error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"
            suppressHydrationWarning
        >
            <main className="w-full max-w-md p-6 mx-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        ES139 Attendance Checker
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Harvard School of Engineering
                    </p>
                </div>

                {!gpsPermission && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-medium">
                                Location Required
                            </span>
                        </div>
                        <p className="text-sm">
                            Please enable location services and
                            <button
                                onClick={checkGPSPermission}
                                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                click here to retry
                            </button>
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="Harvard email"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Harvard ID
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="8-digit HUID"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            value={formData.huid}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    huid: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Your full name"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !gpsPermission}
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Recording...
                            </span>
                        ) : (
                            "Record Attendance"
                        )}
                    </button>
                </form>

                {message && (
                    <div
                        className={`mt-6 p-4 rounded-lg text-center shadow-sm ${
                            message.startsWith("Error")
                                ? "bg-red-50 border border-red-200 text-red-700"
                                : "bg-green-50 border border-green-200 text-green-700"
                        }`}
                    >
                        {message}
                    </div>
                )}
            </main>
        </div>
    );
}
