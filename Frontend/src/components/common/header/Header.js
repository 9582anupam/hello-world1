import React, { useState, useContext, useRef, useEffect } from "react";
import { Brain, Menu, X, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";
import userAuthenticatedAxiosInstance from "../../../services/users/userAuthenticatedAxiosInstance";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { isUserLoggedIn, setIsUserLoggedIn } = useContext(UserContext);
    const navigate = useNavigate();
    const profileRef = useRef(null);

    const userAxiosInstance = userAuthenticatedAxiosInstance("/api/v1/users");

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
        const response = await userAxiosInstance.post("/logout");
        console.log(response);
        console.log("User logged out successfully");
        } catch (error) {
        console.error("An error occurred", error.message);
        } finally {
        localStorage.removeItem("accessToken");
        setIsUserLoggedIn(false);
        setIsProfileOpen(false);
        navigate("/");
        console.log("User logged out unsuccessfully");
        }
    };

    return (
        <nav className="bg-slate-950/90 backdrop-blur-sm sticky top-0 z-50 border-b border-cyan-900/30">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Brain className="h-8 w-8 text-cyan-400" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                AssessGenAI
                </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
                <Link to="#about" className="text-slate-300 hover:text-cyan-400 transition-colors">
                About
                </Link>
                <Link to="#how-it-works" className="text-slate-300 hover:text-cyan-400 transition-colors">
                How It Works
                </Link>
                <Link to="#features" className="text-slate-300 hover:text-cyan-400 transition-colors">
                Features
                </Link>
                <Link to="#audience" className="text-slate-300 hover:text-cyan-400 transition-colors">
                For Who
                </Link>
                <Link to="#rewards" className="text-slate-300 hover:text-cyan-400 transition-colors">
                Rewards
                </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-cyan-400">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* User Profile or Login Button */}
            <div className="flex items-center">
                {isUserLoggedIn ? (
                <div className="relative" ref={profileRef}>
                    <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="bg-white text-black rounded-full p-2 hover:bg-gray-100 transition-colors"
                    >
                    <User size={24} className="text-[#74B83E]" />
                    </button>
                    {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                        >
                        Profile
                        </Link>
                        <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                        Logout
                        </button>
                    </div>
                    )}
                </div>
                ) : (
                <Link
                    to="/login"
                    className="hidden md:block bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white px-5 py-2 rounded-md transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                >
                    Sign In
                </Link>
                )}
            </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-slate-800">
                <div className="flex flex-col space-y-4">
                <Link to="#about" className="text-slate-300 hover:text-cyan-400 transition-colors">
                    About
                </Link>
                <Link to="#how-it-works" className="text-slate-300 hover:text-cyan-400 transition-colors">
                    How It Works
                </Link>
                <Link to="#features" className="text-slate-300 hover:text-cyan-400 transition-colors">
                    Features
                </Link>
                <Link to="#audience" className="text-slate-300 hover:text-cyan-400 transition-colors">
                    For Who
                </Link>
                <Link to="#rewards" className="text-slate-300 hover:text-cyan-400 transition-colors">
                    Rewards
                </Link>
                <Link
                    to="/login"
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white px-5 py-2 rounded-md transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 w-full"
                >
                    Sign In
                </Link>
                </div>
            </div>
            )}
        </div>
        </nav>
    );
};

export default Header;
