"""Unified GUI for the pricing workflow."""
import tkinter as tk
from tkinter import ttk
import threading

import manage_products
import scraper
import price_optimizer
import dashboard


class PricingApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        root.title("Dzukou Pricing Toolkit")
        root.geometry("500x400")

        frame = ttk.Frame(root, padding=20)
        frame.grid(sticky="nsew")
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)

        ttk.Button(
            frame,
            text="1. Manage Products",
            command=self.open_product_manager,
            width=30,
        ).grid(row=0, column=0, pady=5)
        ttk.Button(
            frame,
            text="2. Scrape Competitor Prices",
            command=lambda: self.run_in_thread(self.run_scraper),
            width=30,
        ).grid(row=1, column=0, pady=5)
        ttk.Button(
            frame,
            text="3. Optimize Prices",
            command=lambda: self.run_in_thread(self.run_optimizer),
            width=30,
        ).grid(row=2, column=0, pady=5)
        ttk.Button(
            frame,
            text="4. Build Dashboard",
            command=lambda: self.run_in_thread(self.run_dashboard),
            width=30,
        ).grid(row=3, column=0, pady=5)

        self.output = tk.Text(frame, height=10)
        self.output.grid(row=4, column=0, sticky="nsew", pady=(15, 0))
        frame.rowconfigure(4, weight=1)
        frame.columnconfigure(0, weight=1)

    def open_product_manager(self):
        top = tk.Toplevel(self.root)
        manage_products.ProductManagerGUI(top)

    def run_in_thread(self, func):
        threading.Thread(target=func, daemon=True).start()

    def run_scraper(self):
        self.append_output("Running scraper...")
        try:
            scraper.main()
            self.append_output("Scraper finished")
        except Exception as exc:
            self.append_output(f"Scraper error: {exc}")

    def run_optimizer(self):
        self.append_output("Running price optimizer...")
        try:
            price_optimizer.main()
            self.append_output("Price optimizer finished")
        except Exception as exc:
            self.append_output(f"Optimizer error: {exc}")

    def run_dashboard(self):
        self.append_output("Building dashboard...")
        try:
            dashboard.main()
            self.append_output("Dashboard created")
        except Exception as exc:
            self.append_output(f"Dashboard error: {exc}")

    def append_output(self, text: str):
        self.output.insert(tk.END, text + "\n")
        self.output.see(tk.END)


def main():
    root = tk.Tk()
    app = PricingApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
