import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Calculator, Delete, X } from "lucide-react";
import { useState } from "react";

type CalcOp = "+" | "-" | "×" | "÷" | null;

// USD-base exchange rates (approximate)
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  AED: 3.67,
  SGD: 1.35,
  JPY: 149.5,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.89,
  HKD: 7.82,
  MYR: 4.72,
  THB: 35.6,
  BRL: 4.97,
  ZAR: 18.6,
  SAR: 3.75,
  KWD: 0.307,
  QAR: 3.64,
  PKR: 278,
  BDT: 110,
  LKR: 317,
  NGN: 1550,
  EGP: 30.9,
  KES: 130,
};

const CURRENCIES = Object.keys(USD_RATES);

function convert(amount: number, from: string, to: string): number {
  const fromRate = USD_RATES[from] ?? 1;
  const toRate = USD_RATES[to] ?? 1;
  return (amount / fromRate) * toRate;
}

const CALC_ROWS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [fresh, setFresh] = useState(false);
  const [history, setHistory] = useState<string>("");

  const [tab, setTab] = useState<"calc" | "currency">("calc");
  const [currFrom, setCurrFrom] = useState("USD");
  const [currTo, setCurrTo] = useState("INR");
  const [currInput, setCurrInput] = useState("");

  function handleCalc(val: string) {
    if (val === "C") {
      setDisplay("0");
      setPrev(null);
      setOp(null);
      setFresh(false);
      setHistory("");
      return;
    }
    if (val === "⌫") {
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    if (val === "±") {
      setDisplay((d) => {
        const n = Number.parseFloat(d) * -1;
        return Number.isNaN(n) ? "0" : String(n);
      });
      return;
    }
    if (val === "%") {
      setDisplay((d) => {
        const n = Number.parseFloat(d) / 100;
        return Number.isNaN(n) ? "0" : String(n);
      });
      return;
    }
    if (["+", "-", "×", "÷"].includes(val)) {
      const cur = Number.parseFloat(display);
      setHistory(`${cur} ${val}`);
      setPrev(cur);
      setOp(val as CalcOp);
      setFresh(true);
      return;
    }
    if (val === "=") {
      if (prev === null || op === null) return;
      const cur = Number.parseFloat(display);
      let res = 0;
      if (op === "+") res = prev + cur;
      if (op === "-") res = prev - cur;
      if (op === "×") res = prev * cur;
      if (op === "÷") res = cur !== 0 ? prev / cur : 0;
      const formatted = String(Number.parseFloat(res.toFixed(8)));
      setHistory(`${prev} ${op} ${cur} =`);
      setDisplay(formatted);
      setPrev(null);
      setOp(null);
      setFresh(false);
      return;
    }
    if (val === "." && display.includes(".") && !fresh) return;
    setDisplay((d) => {
      if (fresh) {
        setFresh(false);
        return val === "." ? "0." : val;
      }
      return d === "0" && val !== "." ? val : d + val;
    });
  }

  const convertedAmount =
    currInput !== "" && !Number.isNaN(Number(currInput))
      ? convert(Number(currInput), currFrom, currTo)
      : null;

  const rate = convert(1, currFrom, currTo);

  function swapCurrencies() {
    setCurrFrom(currTo);
    setCurrTo(currFrom);
  }

  return (
    <aside
      className="fixed top-0 left-60 z-50 h-full w-72 flex flex-col bg-card border-r border-border shadow-panel panel-slide-in"
      data-ocid="panel-calculator"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
        <span className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Calculator className="size-4 text-accent" />
          Calculator
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
          aria-label="Close calculator"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(["calc", "currency"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === t
                ? "border-b-2 border-accent text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "calc" ? "Calculator" : "Currency"}
          </button>
        ))}
      </div>

      {tab === "calc" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Display */}
          <div className="px-4 py-3 bg-background/50 text-right border-b border-border/50">
            <p className="text-xs text-muted-foreground min-h-[16px] tabular-nums">
              {history || "\u00A0"}
            </p>
            <p
              className="text-3xl font-display font-semibold text-foreground tabular-nums break-all leading-tight"
              data-ocid="calc-display"
            >
              {display}
            </p>
          </div>
          {/* Buttons */}
          <div
            className="flex-1 p-2 grid gap-1.5"
            style={{ gridTemplateRows: "repeat(5, 1fr)" }}
          >
            {CALC_ROWS.map((row) => (
              <div key={row.join("")} className="grid grid-cols-4 gap-1.5">
                {row.map((btn) => {
                  const isOp = ["+", "-", "×", "÷"].includes(btn);
                  const isEq = btn === "=";
                  const isFn = ["C", "±", "%"].includes(btn);
                  const isActive = btn === op;
                  return (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalc(btn)}
                      data-ocid={`calc-btn-${btn}`}
                      className={cn(
                        "flex items-center justify-center h-full min-h-[48px] rounded-lg text-sm font-semibold transition-all active:scale-95",
                        isEq &&
                          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
                        isOp &&
                          !isEq &&
                          isActive &&
                          "bg-accent text-accent-foreground",
                        isOp &&
                          !isEq &&
                          !isActive &&
                          "bg-accent/15 text-accent hover:bg-accent/25",
                        isFn &&
                          "bg-muted text-muted-foreground hover:bg-muted/70",
                        !isEq &&
                          !isOp &&
                          !isFn &&
                          "bg-card border border-border text-foreground hover:bg-muted",
                      )}
                    >
                      {btn === "⌫" ? <Delete className="size-4" /> : btn}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "currency" && (
        <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">
          {/* Amount input */}
          <div>
            <label
              htmlFor="currency-amount"
              className="text-xs text-muted-foreground mb-1.5 block font-medium"
            >
              Amount
            </label>
            <input
              id="currency-amount"
              type="number"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-lg font-semibold text-foreground outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
              placeholder="0.00"
              value={currInput}
              onChange={(e) => setCurrInput(e.target.value)}
              data-ocid="currency-input"
            />
          </div>

          {/* From / Swap / To */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="currency-from"
                className="text-xs text-muted-foreground mb-1.5 block font-medium"
              >
                From
              </label>
              <select
                id="currency-from"
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                value={currFrom}
                onChange={(e) => setCurrFrom(e.target.value)}
                data-ocid="currency-from"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swapCurrencies}
              aria-label="Swap currencies"
              data-ocid="currency-swap"
              className="mb-0.5 p-2 rounded-md border border-border bg-muted hover:bg-accent/10 hover:text-accent transition-colors"
            >
              <ArrowLeftRight className="size-3.5" />
            </button>
            <div className="flex-1">
              <label
                htmlFor="currency-to"
                className="text-xs text-muted-foreground mb-1.5 block font-medium"
              >
                To
              </label>
              <select
                id="currency-to"
                className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                value={currTo}
                onChange={(e) => setCurrTo(e.target.value)}
                data-ocid="currency-to"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result */}
          {convertedAmount !== null ? (
            <div
              className="rounded-lg border border-accent/20 p-4 text-center"
              style={{ background: "oklch(var(--accent) / 0.08)" }}
              data-ocid="currency-result"
            >
              <p className="text-xs text-muted-foreground">
                {currInput} {currFrom} equals
              </p>
              <p className="text-3xl font-display font-bold text-accent tabular-nums mt-0.5">
                {convertedAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </p>
              <p className="text-sm font-semibold text-foreground/80 mt-0.5">
                {currTo}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                1 {currFrom} = {rate.toFixed(4)} {currTo}
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg border border-border/50 p-4 text-center"
              style={{ background: "oklch(var(--muted) / 0.4)" }}
            >
              <p className="text-xs text-muted-foreground">
                Enter an amount to convert
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                1 {currFrom} = {rate.toFixed(4)} {currTo}
              </p>
            </div>
          )}

          {/* Reset */}
          <button
            type="button"
            onClick={() => setCurrInput("")}
            data-ocid="currency-clear"
            className="text-xs text-muted-foreground hover:text-destructive transition-colors text-center"
          >
            Clear
          </button>
        </div>
      )}
    </aside>
  );
}
