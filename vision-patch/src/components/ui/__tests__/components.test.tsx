import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, Input, Select, Chip, ChipGroup, Badge, Toggle, Alert } from "../index";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when loading", () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.firstChild).toHaveClass("bg-red-600");
  });

  it("applies fullWidth", () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.firstChild).toHaveClass("w-full");
  });
});

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows required indicator", () => {
    render(<Input label="Nom" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input label="Email" error="Email invalide" />);
    expect(screen.getByText("Email invalide")).toBeInTheDocument();
  });

  it("shows hint when no error", () => {
    render(<Input label="Code" hint="6 caracteres" />);
    expect(screen.getByText("6 caracteres")).toBeInTheDocument();
  });

  it("hides hint when error present", () => {
    render(<Input label="Code" hint="6 caracteres" error="Trop court" />);
    expect(screen.queryByText("6 caracteres")).not.toBeInTheDocument();
    expect(screen.getByText("Trop court")).toBeInTheDocument();
  });

  it("applies default field style", () => {
    render(<Input label="Surface" isDefault data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveClass("border-dashed");
  });

  it("sets aria-invalid on error", () => {
    render(<Input label="Test" error="Error" />);
    expect(screen.getByLabelText("Test")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Select", () => {
  const options = [
    { value: "h1a", label: "H1a" },
    { value: "h1b", label: "H1b" },
    { value: "h2a", label: "H2a" },
  ];

  it("renders options", () => {
    render(<Select label="Zone" options={options} />);
    expect(screen.getByLabelText("Zone")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("renders placeholder", () => {
    render(<Select label="Zone" options={options} placeholder="Choisir..." />);
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("shows error", () => {
    render(<Select label="Zone" options={options} error="Requis" />);
    expect(screen.getByText("Requis")).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("renders label", () => {
    render(<Chip label="Maison" />);
    expect(screen.getByText("Maison")).toBeInTheDocument();
  });

  it("shows selected state", () => {
    render(<Chip label="Maison" selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    render(<Chip label="Maison" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ChipGroup", () => {
  const options = [
    { value: "maison", label: "Maison" },
    { value: "appt", label: "Appartement" },
    { value: "immeuble", label: "Immeuble" },
  ];

  it("renders all options", () => {
    render(<ChipGroup options={options} />);
    expect(screen.getByText("Maison")).toBeInTheDocument();
    expect(screen.getByText("Appartement")).toBeInTheDocument();
    expect(screen.getByText("Immeuble")).toBeInTheDocument();
  });

  it("calls onChange with value", () => {
    const onChange = vi.fn();
    render(<ChipGroup options={options} onChange={onChange} />);
    fireEvent.click(screen.getByText("Appartement"));
    expect(onChange).toHaveBeenCalledWith("appt");
  });

  it("shows label and error", () => {
    render(<ChipGroup options={options} label="Type" error="Requis" />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Requis")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders text", () => {
    render(<Badge>Brouillon</Badge>);
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("renders with dot", () => {
    const { container } = render(<Badge dot>En cours</Badge>);
    expect(container.querySelector(".rounded-full.bg-current")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  it("renders with label", () => {
    render(<Toggle checked={false} onChange={() => {}} label="Actif" />);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("calls onChange on click", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("reflects checked state", () => {
    render(<Toggle checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});

describe("Alert", () => {
  it("renders message", () => {
    render(<Alert variant="error">Erreur ADEME</Alert>);
    expect(screen.getByText("Erreur ADEME")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<Alert variant="warning" title="Attention">Details</Alert>);
    expect(screen.getByText("Attention")).toBeInTheDocument();
  });

  it("calls onClose", () => {
    const onClose = vi.fn();
    render(<Alert variant="info" onClose={onClose}>Info</Alert>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
