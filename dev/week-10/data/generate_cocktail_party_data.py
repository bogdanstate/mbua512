#!/usr/bin/env python3
"""
Generate synthetic cocktail party position data for K-means clustering demo.
Based on realistic social gathering patterns with conversational groups.
"""

import numpy as np
import pandas as pd

np.random.seed(42)

# Room dimensions (in meters)
ROOM_WIDTH = 20
ROOM_HEIGHT = 15

# Define conversational group centers (people naturally cluster in conversations)
group_centers = [
    (5, 5),    # Group 1: Near entrance
    (15, 5),   # Group 2: Near bar area
    (10, 10),  # Group 3: Center of room
    (5, 12),   # Group 4: Near food table
    (15, 12),  # Group 5: Corner conversation
]

# Number of people per group (realistic cocktail party of ~100 people)
people_per_group = [20, 22, 18, 16, 14]

positions = []
person_id = 1

for i, (cx, cy) in enumerate(group_centers):
    n_people = people_per_group[i]

    # Generate positions with realistic clustering
    # People stand in loose circles/groups, not perfectly clustered
    for _ in range(n_people):
        # Random angle and distance from group center
        angle = np.random.uniform(0, 2 * np.pi)
        # Most people within 1.5m of center, some outliers up to 2.5m
        radius = np.random.gamma(2, 0.5)  # Gamma distribution for realistic spread

        x = cx + radius * np.cos(angle)
        y = cy + radius * np.sin(angle)

        # Keep within room bounds
        x = np.clip(x, 0.5, ROOM_WIDTH - 0.5)
        y = np.clip(y, 0.5, ROOM_HEIGHT - 0.5)

        positions.append({
            'person_id': person_id,
            'x': round(x, 2),
            'y': round(y, 2),
            'true_group': i + 1  # Ground truth for comparison
        })
        person_id += 1

# Add a few "floaters" - people walking between groups
n_floaters = 10
for _ in range(n_floaters):
    x = np.random.uniform(1, ROOM_WIDTH - 1)
    y = np.random.uniform(1, ROOM_HEIGHT - 1)
    positions.append({
        'person_id': person_id,
        'x': round(x, 2),
        'y': round(y, 2),
        'true_group': 0  # Floater/loner
    })
    person_id += 1

# Create DataFrame
df = pd.DataFrame(positions)

# Save to CSV
output_file = '/home/bogdan/mbua512/dev/week-10/data/cocktail-party-positions.csv'
df.to_csv(output_file, index=False)

print(f"Generated {len(df)} person positions")
print(f"Saved to: {output_file}")
print(f"\nSample data:")
print(df.head(10))
print(f"\nGroup distribution:")
print(df['true_group'].value_counts().sort_index())
