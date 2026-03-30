import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useSessionNumber } from "@/lib/use-session-number";

function PageSizeProbe({ storageKey, label }: { storageKey: string; label: string }) {
  const [value, setValue] = useSessionNumber(storageKey, 10);

  return (
    <div>
      <span>{`${label}:${value}`}</span>
      <button type="button" onClick={() => setValue(25)}>
        Set {label}
      </button>
    </div>
  );
}

describe("useSessionNumber", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps independent values for different session keys", async () => {
    const user = userEvent.setup();

    const { unmount } = render(<PageSizeProbe storageKey="rxpad.patients.pageSize" label="patients" />);
    expect(screen.getByText("patients:10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /set patients/i }));
    expect(screen.getByText("patients:25")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("rxpad.patients.pageSize")).toBe("25");

    unmount();

    render(<PageSizeProbe storageKey="rxpad.prescriptionDataset.pageSize" label="dataset" />);
    expect(screen.getByText("dataset:10")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("rxpad.prescriptionDataset.pageSize")).toBe("10");
    expect(window.sessionStorage.getItem("rxpad.patients.pageSize")).toBe("25");
  });
});
