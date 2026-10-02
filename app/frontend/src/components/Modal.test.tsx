import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Modal from "./Modal";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      {open && (
        <Modal title="Mi diálogo" onClose={() => setOpen(false)} footer={<button>Aceptar</button>}>
          <input aria-label="Campo" />
        </Modal>
      )}
    </>
  );
}

describe("Modal", () => {
  it("expone role=dialog con título accesible y foco inicial dentro", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("Abrir"));
    const dialog = screen.getByRole("dialog", { name: "Mi diálogo" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("cierra con Escape y devuelve el foco al botón que lo abrió", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByText("Abrir");
    await user.click(opener);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("atrapa el foco con Tab y Shift+Tab", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("Abrir"));
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("cierra al hacer clic en el botón Cerrar", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText("Abrir"));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
