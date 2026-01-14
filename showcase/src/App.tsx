import { useEffect, useState } from 'react';
import './App.css';
import About from './components/About';
import Components from './components/Components';
import Demo from './components/Demo';
import Hero from './components/Hero';
import { ScrollIndicator } from './components/ScrollIndicator';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app" id="main-content">
      <Hero scrollY={scrollY} />
      <Components />
      <Demo />
      <About />
      <ScrollIndicator targetId="home" showProgress={true} />
    </div>
  );
}

export default App;
