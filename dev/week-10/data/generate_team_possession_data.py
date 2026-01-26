#!/usr/bin/env python3
"""
Generate team possession data by position type across a season.
Based on real Premier League 2023-2024 tactical patterns.

Each team's vector: [GK_touches, DEF_touches, MID_touches, FWD_touches]
Values represent average touches per game for players in that position.
"""

import numpy as np
import pandas as pd

np.random.seed(42)

# Premier League teams with their tactical styles
teams_data = {
    # Possession-dominant teams (high midfield touches)
    "Manchester City": {"style": "possession", "GK": 35, "DEF": 65, "MID": 85, "FWD": 55},
    "Arsenal": {"style": "possession", "GK": 32, "DEF": 63, "MID": 82, "FWD": 58},
    "Liverpool": {"style": "possession", "GK": 30, "DEF": 60, "MID": 78, "FWD": 62},

    # Balanced possession teams
    "Tottenham": {"style": "balanced", "GK": 28, "DEF": 55, "MID": 70, "FWD": 58},
    "Newcastle": {"style": "balanced", "GK": 27, "DEF": 58, "MID": 68, "FWD": 52},
    "Manchester Utd": {"style": "balanced", "GK": 29, "DEF": 56, "MID": 72, "FWD": 55},
    "Chelsea": {"style": "balanced", "GK": 30, "DEF": 57, "MID": 71, "FWD": 54},
    "Brighton": {"style": "balanced", "GK": 31, "DEF": 59, "MID": 73, "FWD": 51},

    # Counter-attacking teams (lower possession, higher forward emphasis)
    "Aston Villa": {"style": "counter", "GK": 26, "DEF": 52, "MID": 65, "FWD": 56},
    "West Ham": {"style": "counter", "GK": 24, "DEF": 50, "MID": 62, "FWD": 54},
    "Wolves": {"style": "counter", "GK": 25, "DEF": 51, "MID": 63, "FWD": 53},

    # Defensive teams (low possession overall)
    "Brentford": {"style": "defensive", "GK": 22, "DEF": 48, "MID": 58, "FWD": 48},
    "Crystal Palace": {"style": "defensive", "GK": 21, "DEF": 47, "MID": 57, "FWD": 47},
    "Fulham": {"style": "defensive", "GK": 23, "DEF": 49, "MID": 59, "FWD": 49},
    "Everton": {"style": "defensive", "GK": 20, "DEF": 45, "MID": 55, "FWD": 45},
    "Bournemouth": {"style": "defensive", "GK": 22, "DEF": 46, "MID": 56, "FWD": 46},
}

# Generate data with some variance (simulating match-to-match variation)
data = []

for team, stats in teams_data.items():
    # Add realistic variance (±5-10%)
    gk_avg = stats["GK"] + np.random.normal(0, 3)
    def_avg = stats["DEF"] + np.random.normal(0, 5)
    mid_avg = stats["MID"] + np.random.normal(0, 6)
    fwd_avg = stats["FWD"] + np.random.normal(0, 5)

    data.append({
        "Team": team,
        "Style": stats["style"],
        "GK_Touches": round(max(15, gk_avg), 1),
        "DEF_Touches": round(max(35, def_avg), 1),
        "MID_Touches": round(max(45, mid_avg), 1),
        "FWD_Touches": round(max(35, fwd_avg), 1),
    })

df = pd.DataFrame(data)

# Calculate total possession (sum of all position touches)
df["Total_Touches"] = df["GK_Touches"] + df["DEF_Touches"] + df["MID_Touches"] + df["FWD_Touches"]

# Save to CSV
output_path = "data/team_possession_by_position.csv"
df.to_csv(output_path, index=False)

print(f"✓ Generated possession data for {len(df)} teams")
print(f"✓ Saved to: {output_path}")
print("\nSample data:")
print(df.head(10))

print("\n" + "="*60)
print("Team Styles Summary:")
print("="*60)
for style in df["Style"].unique():
    style_teams = df[df["Style"] == style]
    print(f"\n{style.upper()} ({len(style_teams)} teams):")
    print(f"  Avg MID touches: {style_teams['MID_Touches'].mean():.1f}")
    print(f"  Avg FWD touches: {style_teams['FWD_Touches'].mean():.1f}")
    print(f"  Avg Total: {style_teams['Total_Touches'].mean():.1f}")
