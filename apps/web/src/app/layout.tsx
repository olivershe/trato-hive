import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Trato Hive | Intelligent M&A Canvas",
    description: "Next-generation M&A CRM with verifiable AI-driven insights.",
};

import { TRPCReactProvider } from "@/trpc/provider";
import { CitationProvider, CitationSidebar } from "@/components/citation";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light">
            <body className={`${inter.variable} font-sans antialiased bg-white`}>
                <TRPCReactProvider>
                    <CitationProvider>
                        {children}
                        <CitationSidebar />
                    </CitationProvider>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
