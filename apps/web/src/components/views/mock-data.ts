export interface Deal {
    id: string;
    title: string;
    value: string;
    intValue: number; // for sorting/charts
    company: string;
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
        stage: "CLOSING",
        date: "Dec 30",
        closingDate: new Date("2025-12-30"),
        probability: 95
    },
];
