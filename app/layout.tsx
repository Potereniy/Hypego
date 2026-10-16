import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = {title:'Hypego — Minecraft проект',description:'Официальный портал Minecraft-проекта Hypego'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
