import pandas as pd
import plotly.express as px
from pathlib import Path

OVERVIEW_CSV = "Dzukou_Pricing_Overview_With_Names - Copy.csv"
RECOMMENDED_CSV = "recommended_prices.csv"
OUT_HTML = "dashboard.html"


def load_data():
    overview = pd.read_csv(OVERVIEW_CSV, encoding="cp1252")
    recommended = pd.read_csv(RECOMMENDED_CSV)
    overview["Current Price"] = overview[" Current Price "].str.replace("€", "").astype(float)
    overview["Unit Cost"] = overview[" Unit Cost "].str.replace("€", "").astype(float)
    df = recommended.merge(
        overview[["Product Name", "Product ID", "Current Price", "Unit Cost"]],
        on=["Product Name", "Product ID"],
        how="left",
    )
    df["Recommended Price"] = df["Recommended Price"].astype(float)
    df["Price Delta"] = df["Recommended Price"] - df["Current Price"]
    df["Price Delta %"] = (df["Price Delta"] / df["Current Price"]) * 100
    return df


def build_dashboard(df, out_path=OUT_HTML):
    """Generate an HTML dashboard with interactive charts."""
    fig_delta = px.bar(
        df,
        x="Product Name",
        y="Profit Delta",
        color="Profit Delta",
        color_continuous_scale="RdYlGn",
        title="Profit Delta by Product",
    )
    fig_delta.update_layout(
        xaxis_title="Product",
        yaxis_title="Profit Delta (€)",
        xaxis_tickangle=-45,
    )

    fig_price = px.bar(
        df,
        x="Product Name",
        y=["Current Price", "Recommended Price"],
        barmode="group",
        title="Current vs Recommended Prices",
    )
    fig_price.update_layout(
        xaxis_title="Product",
        yaxis_title="Price (€)",
        xaxis_tickangle=-45,
    )

    html = f"""
<html>
<head>
    <meta charset='utf-8'>
    <title>Dzukou Pricing Dashboard</title>
    <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'>
    <style>
        body {{ padding: 20px; font-family: Arial, sans-serif; }}
        h1 {{ margin-bottom: 30px; }}
    </style>
</head>
<body>
    <h1>Dzukou Pricing Dashboard</h1>
    {fig_delta.to_html(full_html=False, include_plotlyjs='cdn')}
    {fig_price.to_html(full_html=False, include_plotlyjs=False)}
    <h2 class='mt-4'>Detailed Data</h2>
    {df.to_html(index=False, classes='table table-striped', float_format=lambda x: f'{x:.2f}')}
</body>
</html>
"""
    Path(out_path).write_text(html, encoding="utf-8")
    print(f"Dashboard saved to {out_path}")


def main():
    df = load_data()
    build_dashboard(df)


if __name__ == "__main__":
    main()
