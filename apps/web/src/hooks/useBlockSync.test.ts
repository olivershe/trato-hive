// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { useBlockSync } from "./useBlockSync";
import { api } from "../trpc/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock tRPC
vi.mock("../trpc/react", () => ({
    api: {
        block: {
            sync: {
                useMutation: vi.fn(),
            },
        },
        useUtils: vi.fn(),
    },
}));

describe("useBlockSync", () => {
    const mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (api.block.sync.useMutation as any).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        });
        vi.useFakeTimers();
    });

    it("should initialize with saved status", () => {
        const { result } = renderHook(() => useBlockSync("page-1", { type: "doc" }));
        expect(result.current.status).toBe("Saved");
        expect(result.current.content).toEqual({ type: "doc" });
    });

    it("should debounce updates", () => {
        const { result } = renderHook(() => useBlockSync("page-1", { type: "doc" }));

        act(() => {
            result.current.updateContent({ type: "doc", content: [] });
        });

        expect(result.current.status).toBe("Saving...");
        expect(mockMutate).not.toHaveBeenCalled();

        // Fast forward debounce
        act(() => {
            vi.advanceTimersByTime(500); // Halfway
        });
        expect(mockMutate).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(600); // Complete
        });

        expect(mockMutate).toHaveBeenCalledWith({
            pageId: "page-1",
            content: { type: "doc", content: [] }
        });
        // Note: In real hook, status only changes to "Saved" on onSuccess callback, 
        // which we didn't trigger in mock unless we mock implementation.
        // Ideally we verify mutation call.
    });
});
