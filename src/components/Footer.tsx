import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 px-6 bg-white/90 dark:bg-gray-900/90 shadow-inner animate-fadein text-center font-body text-gray-600 dark:text-gray-300">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start relative">
          <img src="/iiit-logo.jpg" alt="IIIT Dharwad Logo" className="w-12 h-12 mb-2 rounded-full shadow-lg border-2 border-blue-400 dark:border-magenta-400" />
          <span className="text-lg font-semibold tracking-wide animate-fadein dark:text-neon-magenta dark:text-stroke-white">&copy; {currentYear} IIIT Dharwad Lost & Found. All rights reserved.</span>
          <span className="text-sm mt-2 animate-fadein dark:text-neon-magenta dark:text-stroke-white">Indian Institute of Information Technology Dharwad</span>
          <span className="text-sm animate-fadein dark:text-neon-magenta dark:text-stroke-white">Ittigatti Road, Near Sattur Colony, Dharwad, Karnataka 580009</span>
          <span className="text-sm animate-fadein dark:text-neon-magenta dark:text-stroke-white">Email: contact@iiitdwd.ac.in</span>
          <span className="text-sm animate-fadein dark:text-neon-magenta dark:text-stroke-white">Phone: +91-836-2250879</span>
          <div className="absolute inset-0 -z-10 animate-gradient-bg" />
        </div>
        <nav className="flex gap-6 mt-4 md:mt-0">
          <a className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-neon-magenta dark:text-stroke-white animate-fadein" href="/">Home</a>
          <a className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-neon-magenta dark:text-stroke-white animate-fadein" href="/items/lost">Lost Items</a>
          <a className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-neon-magenta dark:text-stroke-white animate-fadein" href="/items/found">Found Items</a>
          <a className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-neon-magenta dark:text-stroke-white animate-fadein" href="/report">Report Item</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
