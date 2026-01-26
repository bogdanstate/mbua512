#!/usr/bin/env python3
"""
Generate network graph JSON for teams based on cosine similarity of possession patterns.
"""

import pandas as pd
import json

# Load distance matrix
distance_df = pd.read_csv('data/distance-studies/cosine-team-distance.csv', index_col=0)

# Load team data for metadata
teams_df = pd.read_csv('data/team_possession_by_position.csv')

# Create nodes
nodes = []
for idx, row in teams_df.iterrows():
    nodes.append({
        'id': row['Team'],
        'label': row['Team'],
        'style': row['Style'],
        'touches': {
            'GK': float(row['GK_Touches']),
            'DEF': float(row['DEF_Touches']),
            'MID': float(row['MID_Touches']),
            'FWD': float(row['FWD_Touches']),
            'Total': float(row['Total_Touches'])
        }
    })

# Create edges (only for similar teams)
# With normalization, we get a wider range of similarities
# Let's use a threshold that captures meaningful similarities
MIN_SIMILARITY = 0.90  # Teams with >90% pattern similarity
MAX_DISTANCE = 1 - MIN_SIMILARITY

edges = []
teams = distance_df.index.tolist()

for i, team1 in enumerate(teams):
    for j, team2 in enumerate(teams):
        if i < j:  # Only upper triangle to avoid duplicates
            distance = distance_df.loc[team1, team2]

            if distance < MAX_DISTANCE:
                similarity = 1 - distance
                edges.append({
                    'source': team1,
                    'target': team2,
                    'distance': float(distance),
                    'similarity': float(similarity),
                    'weight': float(similarity)
                })

# Sort edges by similarity (descending)
edges.sort(key=lambda x: x['similarity'], reverse=True)

print(f"✓ Created {len(nodes)} nodes")
print(f"✓ Created {len(edges)} edges (similarity > {MIN_SIMILARITY})")

# Create network JSON
network = {
    'nodes': nodes,
    'edges': edges,
    'metadata': {
        'description': 'Premier League teams connected by similar possession patterns by position',
        'metric': 'cosine_similarity',
        'min_similarity': MIN_SIMILARITY,
        'features': ['GK_Touches', 'DEF_Touches', 'MID_Touches', 'FWD_Touches']
    }
}

# Save to JSON
output_path = 'data/distance-studies/cosine-team-network.json'
with open(output_path, 'w') as f:
    json.dump(network, f, indent=2)

print(f"✓ Saved network to: {output_path}")

# Show top 10 most similar pairs
print("\n" + "="*60)
print("Top 10 Most Similar Team Pairs:")
print("="*60)
for i, edge in enumerate(edges[:10]):
    print(f"{i+1}. {edge['source']} ↔ {edge['target']}: cos={edge['similarity']:.5f}")
