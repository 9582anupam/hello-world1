import React, { useState, useContext } from "react";
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    IconButton,
    ThemeProvider,
    createTheme,
    InputAdornment,
} from "@mui/material";
import { styled } from "@mui/system";
import { Link, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Mail, Lock } from 'lucide-react';
import "./auth.css";
import axios from "axios";
import { UserContext } from "../../../context/UserContext";

// Define the custom theme to match the landing page
const theme = createTheme({
    palette: {
        primary: {
            main: "#22d3ee", // Cyan-500
        },
        secondary: {
            main: "#6366f1", // Indigo-500
        },
        background: {
            default: "#0f172a", // Slate-900
            paper: "#1e293b", // Slate-800
        },
        text: {
            primary: "#f1f5f9", // Slate-100
            secondary: "#94a3b8", // Slate-400
        },
        error: {
            main: "#ef4444", // Red-500
        },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(34, 211, 238, 0.3)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(34, 211, 238, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#22d3ee',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#94a3b8',
                    },
                    '& .MuiInputBase-input': {
                        color: '#f1f5f9',
                    },
                },
            },
        },
    },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 400,
    margin: "auto",
    textAlign: "center",
    backgroundColor: "#1e293b", // Slate-800
    borderRadius: "0.75rem",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "&:hover": {
        boxShadow: "0 0 15px rgba(34, 211, 238, 0.2)",
    },
    transition: "all 0.3s ease",
}));

const StyledForm = styled("form")(({ theme }) => ({
    width: "100%",
    marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(3, 0, 2),
    background: "linear-gradient(to right, #22d3ee, #6366f1)",
    color: "white",
    fontWeight: "bold",
    padding: "10px 0",
    "&:hover": {
        background: "linear-gradient(to right, #0891b2, #4f46e5)",
        boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)",
    },
    transition: "all 0.3s ease",
}));

const GoogleButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(2, 0),
    borderColor: "rgba(34, 211, 238, 0.5)",
    color: "#f1f5f9",
    "&:hover": {
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34, 211, 238, 0.1)",
    },
}));

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setIsUserLoggedIn } = useContext(UserContext);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitted(true);
        setEmailError("");
        setGeneralError("");
        setError("");

        if (!email) {
            setEmailError("Email is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const response = await axios.post(
                `${BACKEND_URL}/api/v1/users/login`,
                { email, password },
                { withCredentials: true }
            );
            const data = response.data;
            if (data.success) {
                localStorage.setItem("accessToken", data.user.accessToken);
                setIsUserLoggedIn(true); // Update login state
                navigate("/");
            } else {
                setGeneralError(data.message);
                console.log(data.message);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <div className="h-[calc(100svh-5rem)] flex justify-center items-center bg-slate-950">
                <Container component="main" maxWidth="xs" className="relative">
                    <StyledPaper elevation={3}>
                        <div className="flex items-center w-full relative">
                            <IconButton
                                onClick={() => navigate("/")}
                                color="primary"
                                size="small"
                                sx={{ position: "absolute", left: "0" }}>
                                <ArrowBackIcon
                                    sx={{ height: "28px", width: "28px" }}
                                />
                            </IconButton>
                            <Typography
                                variant="h4"
                                gutterBottom
                                sx={{ 
                                    fontWeight: "bold", 
                                    margin: "0 auto",
                                    background: "linear-gradient(to right, #22d3ee, #6366f1)",
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}>
                                Login
                            </Typography>
                        </div>
                        
                        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto mb-6"></div>

                        <StyledForm noValidate onSubmit={handleSubmit}>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={isSubmitted && !!emailError}
                                helperText={isSubmitted && emailError}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Mail size={20} color="#22d3ee" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={isSubmitted && !!generalError}
                                helperText={isSubmitted && generalError}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock size={20} color="#22d3ee" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {error && (
                                <Typography
                                    color="error"
                                    variant="body2"
                                    align="center"
                                    sx={{ mt: 1 }}>
                                    {error}
                                </Typography>
                            )}
                            <SubmitButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                disableElevation>
                                Login
                            </SubmitButton>
                            <GoogleButton
                                fullWidth
                                variant="outlined"
                                // onClick={handleGoogleSignIn}
                            >
                                Login with Google
                            </GoogleButton>
                            <Box mt={2}>
                                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                                    Don't have an account?{" "}
                                    <Link
                                        to="/signup"
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                        Sign Up
                                    </Link>
                                </Typography>
                            </Box>
                        </StyledForm>
                    </StyledPaper>
                </Container>
            </div>
        </ThemeProvider>
    );
};

export default Login;