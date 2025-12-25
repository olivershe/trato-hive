"use client";

import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@trato-hive/api";

export const api: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();
