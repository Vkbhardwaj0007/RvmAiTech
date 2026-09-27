import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { SiteProvider } from './api/SiteContext';
import { LangProvider } from './api/Lang';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import GA from './components/GA';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Technologies from './pages/Technologies';
import InfoDetail from './pages/InfoDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import WorkflowDetail from './pages/WorkflowDetail';
import Leadership from './pages/Leadership';
import TeamDetail from './pages/TeamDetail';
import News from './pages/News';
import Careers from './pages/Careers';
import Apply from './pages/Apply';
import JobDetail from './pages/JobDetail';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import Contact from './pages/Contact';
import AdminLogin from './admin/AdminLogin';
import ResetPassword from './admin/ResetPassword';
import AdminLayout from './admin/AdminLayout';
import Manage from './admin/Manage';
import { AdminHome, Messages } from './admin/Messages';
import AboutAdmin from './admin/AboutAdmin';
import SettingsAdmin from './admin/SettingsAdmin';
import Admins from './admin/Admins';
import Applications from './admin/Applications';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <ScrollTop />
      <Header />
      <main><Outlet /></main>
      <Footer />
      <WhatsAppFloat />
      <GA />
    </>
  );
}

export default function App() {
  return (
    <SiteProvider>
    <LangProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<InfoDetail kind="services" />} />
          <Route path="technologies" element={<Technologies />} />
          <Route path="technologies/:slug" element={<InfoDetail kind="technologies" />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:slug" element={<ProjectDetail />} />
          <Route path="workflow/:slug" element={<WorkflowDetail />} />
          <Route path="leadership" element={<Leadership />} />
          <Route path="leadership/:slug" element={<TeamDetail />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<PostDetail />} />
          <Route path="careers" element={<Careers />} />
          <Route path="careers/apply" element={<Apply />} />
          <Route path="careers/:slug" element={<JobDetail />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<PostDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Route>

        {/* ADMIN (no public header/footer) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="about" element={<AboutAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="admins" element={<Admins />} />
          <Route path="messages" element={<Messages />} />
          <Route path="applications" element={<Applications />} />
          <Route path=":type" element={<Manage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LangProvider>
    </SiteProvider>
  );
}
