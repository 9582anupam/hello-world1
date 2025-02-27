import "./home.css";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import HowItWorkSection from "./components/HowItWorkSection";
import FeatureSection from "./components/FeatureSection";
import AudienceSection from "./components/AudienceSection";
import RewardsSection from "./components/RewardsSection"


const Home = () => {
    return (
        <div className="">
            <HeroSection />
            <AboutSection />
            <HowItWorkSection />
            <FeatureSection />
            <AudienceSection />
            <RewardsSection />
        </div>
    );
};

export default Home;
