import type { CardBankId } from "../types";

const MP_YELLOW = "#FFE600";

type Props = {
  bankId: CardBankId;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const boxClass: Record<NonNullable<Props["size"]>, string> = {
  xs: "w-8 h-8 rounded-lg text-[15px]",
  sm: "w-10 h-10 rounded-xl text-[17px]",
  md: "w-11 h-11 rounded-xl text-[19px]",
  lg: "w-12 h-12 rounded-xl text-[22px]",
};

export function BankLogoMark({ bankId, size = "md", className = "" }: Props) {
  const box = `flex items-center justify-center font-bold shrink-0 leading-none ${boxClass[size]} ${className}`;

  if (bankId === "nubank") {
    return (
      <div className={box} style={{ backgroundColor: "#820AD1" }} aria-hidden>
        <span className="text-white">N</span>
      </div>
    );
  }

  if (bankId === "mercado_pago") {
    return (
      <div className={box} style={{ backgroundColor: "#009EE3" }} aria-hidden>
        <span className="inline-flex tracking-tight">
          <span className="text-white">M</span>
          <span style={{ color: MP_YELLOW }}>P</span>
        </span>
      </div>
    );
  }

  const gridBox = box.replace("flex items-center justify-center", "grid place-items-center");

  return (
    <div className={gridBox} style={{ backgroundColor: "#21C25E" }} aria-hidden>
      <span className="text-white leading-none font-bold" style={{ transform: "translateY(-0.03em)" }}>
        P
      </span>
    </div>
  );
}
