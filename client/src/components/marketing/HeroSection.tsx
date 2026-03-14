import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter'; // CAMBIO: wouter
import { motion } from 'framer-motion';

const HeroSection = () => {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-4 bg-monster-dark">
            {/* Background Elements - Reduced Intensity */}
            <div className="absolute inset-0 bg-gradient-to-b from-monster-dark/80 via-monster-dark/90 to-monster-dark/95 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-monster-purple/15 via-transparent to-transparent opacity-60 z-0"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-monster-emerald/15 via-transparent to-transparent opacity-60 z-0"></div>

            {/* Grid Pattern Overlay - Fallback sutil si no existe la imagen */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-[0.03] z-0"></div>

            {/* --- Left Line-Art Illustration (Smartphone) --- */}
            <div className="hidden lg:block lg:absolute lg:bottom-0 lg:left-32 lg:pb-20 lg:pl-10 w-1/4 max-w-[170px] opacity-80 pointer-events-none select-none z-10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 300 600"
                    fill="none"
                    stroke="url(#monster-gradient)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-auto"
                >
                    <defs>
                        <linearGradient id="monster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" /> {/* monster-purple */}
                            <stop offset="50%" stopColor="#3b82f6" /> {/* monster-blue */}
                            <stop offset="100%" stopColor="#10b981" /> {/* monster-emerald */}
                        </linearGradient>
                    </defs>
                    {/* Main Body */}
                    <rect x="10" y="10" width="280" height="580" rx="30" ry="30" />
                    {/* Screen Border */}
                    <rect x="25" y="40" width="250" height="520" rx="5" ry="5" opacity="0.5" />
                    {/* Notch / Dynamic Island Area */}
                    <path d="M 100 40 Q 150 60 200 40" opacity="0.7" />
                    {/* Top Speaker Grill */}
                    <line x1="130" y1="25" x2="170" y2="25" strokeWidth="2" />
                    {/* Side Buttons (Right) */}
                    <line x1="290" y1="100" x2="290" y2="160" strokeWidth="3" /> {/* Power */}
                    <line x1="290" y1="200" x2="290" y2="250" strokeWidth="3" /> {/* Vol Up */}
                    <line x1="290" y1="270" x2="290" y2="320" strokeWidth="3" /> {/* Vol Down */}
                    {/* Side Buttons (Left) */}
                    <line x1="10" y1="120" x2="10" y2="150" strokeWidth="3" /> {/* Mute Switch */}
                    {/* Bottom Ports */}
                    <circle cx="150" cy="570" r="15" opacity="0.5" /> {/* Charging Port */}
                    <circle cx="100" cy="570" r="4" opacity="0.5" />  {/* Mic/Speaker */}
                    <circle cx="200" cy="570" r="4" opacity="0.5" />  {/* Mic/Speaker */}
                    {/* Screen Reflection Lines (Subtle) */}
                    <line x1="40" y1="500" x2="260" y2="50" opacity="0.1" />
                    <line x1="60" y1="520" x2="240" y2="80" opacity="0.1" />
                </svg>
            </div>

            {/* --- Center Text Content --- */}
            <div className="relative z-20 container mx-auto w-full max-w-4xl flex flex-col items-center text-center px-4">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-monster-purple/10 border border-monster-purple/30 text-monster-purple text-sm font-medium mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                >
                    <Sparkles size={16} className="animate-pulse" />
                    <span>Sistema de gestión #1 para técnicos</span>
                </motion.div>

                {/* Main Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-lg"
                >
                    Deja de perder dinero <br className="hidden md:block" /> por desorden. <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-monster-emerald to-monster-blue animate-gradient-x">
                        Controlá tu taller como un profesional
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
                >
                    Gestiona órdenes, inventario, clientes y finanzas desde un solo lugar.
                    <span className="block mt-2 font-medium text-white/90">
                        Aumenta tu eficiencia y maximiza tus ganancias con GSM FIX.
                    </span>
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, ease: "backOut" }}
                >
                    <Link href="/register">
                        <a className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-monster-purple to-monster-blue rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-[0_10px_30px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer">
                            <span className="relative z-10 flex items-center gap-2">
                                Comenzar Prueba Gratis
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            {/* Button Glow Effect */}
                            <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10 z-0"></div>
                        </a>
                    </Link>
                </motion.div>

                {/* Trust Badges / Small Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400/80"
                >
                    <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-monster-emerald"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        Sin tarjeta de crédito
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-monster-blue"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        Configuración en 2 min
                    </span>
                </motion.div>
            </div>

            {/* --- Right Line-Art Illustration (Highly Detailed PC Monitor) --- */}
            <div className="hidden lg:block lg:absolute lg:bottom-0 lg:right-0 lg:pb-20 lg:pr-10 w-1/4 max-w-[320px] opacity-80 pointer-events-none select-none z-10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 400 400"
                    fill="none"
                    stroke="url(#monster-gradient-right)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-auto"
                >
                    <defs>
                        <linearGradient id="monster-gradient-right" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>
                    {/* Monitor Screen Outline */}
                    <rect x="20" y="20" width="360" height="240" rx="10" ry="10" />
                    {/* Inner Screen Bezel */}
                    <rect x="35" y="35" width="330" height="210" rx="4" ry="4" opacity="0.5" />
                    {/* Stand Column */}
                    <path d="M 170 260 L 230 260 L 220 340 L 180 340 Z" />
                    {/* Stand Base */}
                    <path d="M 120 340 L 280 340 L 300 380 L 100 380 Z" />
                    {/* Screen Details/Reflection Lines (Subtle) */}
                    <line x1="50" y1="230" x2="350" y2="50" opacity="0.1" />
                    <line x1="70" y1="240" x2="330" y2="80" opacity="0.1" />
                    {/* Power Button Indicator */}
                    <circle cx="370" cy="250" r="3" opacity="0.8" />
                    {/* Back Vents / Ports hint (top) */}
                    <line x1="100" y1="25" x2="300" y2="25" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
                    {/* Base Details */}
                    <line x1="140" y1="360" x2="260" y2="360" opacity="0.3" />
                </svg>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-monster-dark to-transparent z-10"></div>
        </section>
    );
};

export default HeroSection;