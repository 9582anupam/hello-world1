import Home from "./components/pages/home/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/common/header/Header";
import Footer from "./components/common/footer/Footer";
import Login from "./components/pages/auth/Login";
import Signup from "./components/pages/auth/Signup";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import Unauthenticated from "./routes/Unauthenticated";
import UserProvider from "./context/UserContext";
import { Toaster } from 'react-hot-toast';
import Profile from "./components/pages/profile/Profile";


function App() {


    return (
        <BrowserRouter>
            <UserProvider>
                <div className="App">
                    <Toaster position="bottom-right" />

                    {/* HEADER-NAVBAR-SIDEBAR */}
                    <div className="fixed z-40 w-full">
                        {/* <div
                            className={`${isSidebarActive ? "active" : ""
                                } sidebar-parent z-50`}
                            ref={sidebarRef}>
                            <Sidebar />
                        </div> */}
                        <Header />
                        {/* <NavBar />
                        <div className="min-h-12 md:hidden block">
                            <SearchBar size={"medium"} />
                        </div> */}
                    </div>


                    {/* CONTENT */}
                    <div className="content-wrapper pt-[5rem]">
                        <Routes>
                            {/* Public Routes - No Auth Needed */}
                            <Route path="/" element={<Home />} />

                            {/* Unauthenticated Routes - Only Accessible When Logged Out */}
                            <Route element={<Unauthenticated />}>
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                            </Route>

                            {/* Protected Routes - Only Accessible When Logged In */}
                            <Route element={<ProtectedRoutes />}>
                                <Route path="/profile" element={<Profile />} />
                            </Route>

                        </Routes>
                    </div>

                    {/* FOOTER */}
                    <div>
                        <Footer />
                    </div>
                </div>
            </UserProvider>
        </BrowserRouter>
    );
};

export default App;
