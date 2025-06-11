import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from pathlib import Path

OVERVIEW_CSV = "Dzukou_Pricing_Overview_With_Names - Copy.csv"
RECOMMENDED_CSV = "recommended_prices.csv"
OUT_HTML = "dashboard.html"


def load_data():
    """Load overview and recommendation data and compute deltas."""
    overview = pd.read_csv(OVERVIEW_CSV, encoding="cp1252")
    recommended = pd.read_csv(RECOMMENDED_CSV)

    # Trim whitespace from column names and key fields so merges work
    overview = overview.rename(columns=lambda c: c.strip())
    recommended = recommended.rename(columns=lambda c: c.strip())
    for df in (overview, recommended):
        df["Product Name"] = df["Product Name"].str.strip()
        df["Product ID"] = df["Product ID"].astype(str).str.strip()

    overview["Current Price"] = (
        overview["Current Price"].astype(str).str.replace("€", "").astype(float)
    )
    overview["Unit Cost"] = (
        overview["Unit Cost"].astype(str).str.replace("€", "").astype(float)
    )

    df = recommended.merge(
        overview[["Product Name", "Product ID", "Current Price", "Unit Cost"]],
        on=["Product Name", "Product ID"],
        how="left",
    )
    df["Recommended Price"] = df["Recommended Price"].astype(float)
    df["Price Delta"] = df["Recommended Price"] - df["Current Price"]
    df["Price Delta %"] = (df["Price Delta"] / df["Current Price"]) * 100
    df["Profit Delta"] = df["Profit Delta"].astype(float)
    return df


def build_dashboard(df, out_path=OUT_HTML):
    """Generate a beautiful HTML dashboard with enhanced visuals."""
    # Calculate summary metrics
    total_profit_increase = df["Profit Delta"].sum()
    avg_price_increase = df["Price Delta %"].mean()
    products_with_increase = (df["Price Delta"] > 0).sum()

    # Create profit delta chart
    fig_delta = go.Figure()
    fig_delta.add_trace(
        go.Bar(
            x=df["Product Name"],
            y=df["Profit Delta"],
            marker=dict(
                color=df["Profit Delta"],
                colorscale=[[0, "#e74c3c"], [0.5, "#f39c12"], [1, "#27ae60"]],
                line=dict(width=1, color="rgba(255,255,255,0.3)"),
            ),
            text=[f"€{x:.2f}" for x in df["Profit Delta"]],
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>Profit Delta: €%{y:.2f}<extra></extra>",
        )
    )
    fig_delta.update_layout(
        title=dict(text="Profit Delta by Product", font=dict(size=24, family="Arial")),
        xaxis=dict(title="Products", tickangle=-45),
        yaxis=dict(title="Profit Delta (€)"),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        height=500,
        margin=dict(t=80, b=120),
    )

    # Price comparison chart
    fig_price = go.Figure()
    fig_price.add_trace(
        go.Bar(
            name="Current Price",
            x=df["Product Name"],
            y=df["Current Price"],
            marker=dict(color="#3498db"),
            text=[f"€{x:.2f}" for x in df["Current Price"]],
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>Current: €%{y:.2f}<extra></extra>",
        )
    )
    fig_price.add_trace(
        go.Bar(
            name="Recommended Price",
            x=df["Product Name"],
            y=df["Recommended Price"],
            marker=dict(color="#e74c3c"),
            text=[f"€{x:.2f}" for x in df["Recommended Price"]],
            textposition="outside",
            hovertemplate="<b>%{x}</b><br>Recommended: €%{y:.2f}<extra></extra>",
        )
    )
    fig_price.update_layout(
        barmode="group",
        title=dict(text="Current vs Recommended Prices", font=dict(size=24, family="Arial")),
        xaxis=dict(title="Products", tickangle=-45),
        yaxis=dict(title="Price (€)"),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        height=500,
        margin=dict(t=80, b=120),
    )

    # Price delta percentage chart
    fig_percentage = go.Figure()
    fig_percentage.add_trace(
        go.Scatter(
            x=df["Product Name"],
            y=df["Price Delta %"],
            mode="lines+markers",
            line=dict(color="#9b59b6", shape="spline"),
            marker=dict(size=12, color=df["Price Delta %"], colorscale="Viridis", showscale=True),
            text=[f"{x:.1f}%" for x in df["Price Delta %"]],
            textposition="top center",
            hovertemplate="<b>%{x}</b><br>Price Change: %{y:.1f}%<extra></extra>",
        )
    )
    fig_percentage.update_layout(
        title=dict(text="Price Change Percentage by Product", font=dict(size=24, family="Arial")),
        xaxis=dict(title="Products", tickangle=-45),
        yaxis=dict(title="Price Change (%)"),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        height=400,
        margin=dict(t=80, b=120),
    )

    # Table HTML
    table_html = df.to_html(
        index=False,
        classes="table table-hover",
        table_id="data-table",
        float_format=lambda x: f"{x:.2f}",
    )

    html = f"""
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Dzukou Pricing Dashboard</title>
    <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'>
    <style>
        body{{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);font-family:Poppins,sans-serif;color:#2c3e50;}}
        .main-container{{background:rgba(255,255,255,0.95);margin:20px;border-radius:25px;box-shadow:0 20px 60px rgba(0,0,0,0.1);padding:40px;}}
        .metric-card{{background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);padding:30px;border-radius:20px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.1);}}
        .metric-value{{font-size:2rem;font-weight:700;}}
    </style>
</head>
<body>
<div class='main-container'>
    <div class='mb-5 text-center'>
        <h1>Dzukou Pricing Dashboard</h1>
    </div>
    <div class='row text-center mb-4'>
        <div class='col-md-3 metric-card mb-3'>
            <div class='metric-value'>€{total_profit_increase:,.2f}</div>
            <div>Total Profit Increase</div>
        </div>
        <div class='col-md-3 metric-card mb-3'>
            <div class='metric-value'>{avg_price_increase:.1f}%</div>
            <div>Average Price Change</div>
        </div>
        <div class='col-md-3 metric-card mb-3'>
            <div class='metric-value'>{products_with_increase}</div>
            <div>Products with Price Increase</div>
        </div>
        <div class='col-md-3 metric-card mb-3'>
            <div class='metric-value'>{len(df)}</div>
            <div>Total Products Analyzed</div>
        </div>
    </div>
    <div class='mb-5'>
        {fig_delta.to_html(full_html=False, include_plotlyjs='cdn', config={'displayModeBar': False})}
    </div>
    <div class='mb-5'>
        {fig_price.to_html(full_html=False, include_plotlyjs=False, config={'displayModeBar': False})}
    </div>
    <div class='mb-5'>
        {fig_percentage.to_html(full_html=False, include_plotlyjs=False, config={'displayModeBar': False})}
    </div>
    <div class='table-responsive'>
        {table_html}
    </div>
</div>
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
