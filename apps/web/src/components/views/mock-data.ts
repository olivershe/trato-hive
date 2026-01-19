/**
 * DealCompany - Company associated with a deal [TASK-119]
 */
export interface DealCompany {
    id: string;
    companyId: string;
    name: string;
    industry: string | null;
    role: "PLATFORM" | "ADD_ON" | "SELLER" | "BUYER" | "ADVISOR";
}

export interface Deal {
    id: string;
    title: string;
    value: string;
    intValue: number; // for sorting/charts
    company: string;
    companies: DealCompany[]; // [TASK-119] Multi-company support
    stage: "SOURCING" | "DILIGENCE" | "CLOSING";
    date: string; // Display string
    closingDate: Date; // For sorting/calendar
    probability: number;
}

export const MOCK_DEALS: Deal[] = [
    {
        id: "1",
        title: "Project Alpha",
        value: "$125M",
        intValue: 125000000,
        company: "Acme Corp",
        companies: [{ id: "dc1", companyId: "c1", name: "Acme Corp", industry: "Technology", role: "PLATFORM" }],
        stage: "SOURCING",
        date: "Q1 2026",
        closingDate: new Date("2026-03-30"),
        probability: 20
    },
    {
        id: "2",
        title: "Project Beta",
        value: "$45M",
        intValue: 45000000,
        company: "Beta Inc",
        companies: [{ id: "dc2", companyId: "c2", name: "Beta Inc", industry: "Healthcare", role: "PLATFORM" }],
        stage: "SOURCING",
        date: "Q1 2026",
        closingDate: new Date("2026-02-15"),
        probability: 15
    },
    {
        id: "3",
        title: "Project Gamma",
        value: "$300M",
        intValue: 300000000,
        company: "Gamma Grp",
        companies: [
            { id: "dc3", companyId: "c3", name: "Gamma Grp", industry: "Finance", role: "PLATFORM" },
            { id: "dc4", companyId: "c4", name: "Delta Sub", industry: "Finance", role: "ADD_ON" },
        ],
        stage: "DILIGENCE",
        date: "Jan 25",
        closingDate: new Date("2026-01-25"),
        probability: 60
    },
    {
        id: "4",
        title: "Project Delta",
        value: "$80M",
        intValue: 80000000,
        company: "Delta Sys",
        companies: [{ id: "dc5", companyId: "c5", name: "Delta Sys", industry: "Manufacturing", role: "PLATFORM" }],
        stage: "DILIGENCE",
        date: "Feb 10",
        closingDate: new Date("2026-02-10"),
        probability: 50
    },
    {
        id: "5",
        title: "Project Epsilon",
        value: "$1.2B",
        intValue: 1200000000,
        company: "Epsilon",
        companies: [
            { id: "dc6", companyId: "c6", name: "Epsilon", industry: "Energy", role: "PLATFORM" },
            { id: "dc7", companyId: "c7", name: "Zeta Energy", industry: "Energy", role: "ADD_ON" },
            { id: "dc8", companyId: "c8", name: "Advisor LLC", industry: "Consulting", role: "ADVISOR" },
        ],
        stage: "CLOSING",
        date: "Dec 30",
        closingDate: new Date("2025-12-30"),
        probability: 95
    },
];
