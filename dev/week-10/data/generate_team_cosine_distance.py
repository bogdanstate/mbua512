#!/usr/bin/env python3
"""
Generate cosine distance matrix for teams based on possession by position.
"""

import pandas as pd
import numpy as np

def cosine_similarity_matrix(vectors):
    """Calculate cosine similarity matrix for a set of vectors."""
    # Normalize vectors
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    normalized = vectors / norms

    # Compute similarity as dot product of normalized vectors
    similarity = np.dot(normalized, normalized.T)

    return similarity

# Load team possession data
df = pd.read_csv('data/team_possession_by_position.csv')

# Extract feature vectors (GK, DEF, MID, FWD touches)
features = df[['GK_Touches', 'DEF_Touches', 'MID_Touches', 'FWD_Touches']].values
teams = df['Team'].values

print("Original feature ranges:")
print(f"  GK: {features[:, 0].min():.1f} - {features[:, 0].max():.1f}")
print(f"  DEF: {features[:, 1].min():.1f} - {features[:, 1].max():.1f}")
print(f"  MID: {features[:, 2].min():.1f} - {features[:, 2].max():.1f}")
print(f"  FWD: {features[:, 3].min():.1f} - {features[:, 3].max():.1f}")

# Normalize each feature to [0, 1] range to spread out the distribution
# This prevents teams with similar magnitude but different patterns from being too similar
features_normalized = np.zeros_like(features)
for i in range(features.shape[1]):
    col = features[:, i]
    min_val = col.min()
    max_val = col.max()
    features_normalized[:, i] = (col - min_val) / (max_val - min_val)

print("\nNormalized feature ranges:")
print(f"  GK: {features_normalized[:, 0].min():.1f} - {features_normalized[:, 0].max():.1f}")
print(f"  DEF: {features_normalized[:, 1].min():.1f} - {features_normalized[:, 1].max():.1f}")
print(f"  MID: {features_normalized[:, 2].min():.1f} - {features_normalized[:, 2].max():.1f}")
print(f"  FWD: {features_normalized[:, 3].min():.1f} - {features_normalized[:, 3].max():.1f}")

# Calculate cosine similarity on normalized features
similarity_matrix = cosine_similarity_matrix(features_normalized)

# Convert to distance (1 - similarity)
distance_matrix = 1 - similarity_matrix

# Create distance dataframe
distance_df = pd.DataFrame(
    distance_matrix,
    index=teams,
    columns=teams
)

# Save to CSV
output_path = 'data/distance-studies/cosine-team-distance.csv'
distance_df.to_csv(output_path)

print(f"✓ Generated cosine distance matrix for {len(teams)} teams")
print(f"✓ Saved to: {output_path}")
print("\nSample distances:")
print(distance_df.iloc[:5, :5].round(4))

# Also save similarity matrix for reference
similarity_df = pd.DataFrame(
    similarity_matrix,
    index=teams,
    columns=teams
)
similarity_path = 'data/distance-studies/cosine-team-similarity.csv'
similarity_df.to_csv(similarity_path)
print(f"\n✓ Saved similarity matrix to: {similarity_path}")

# Show some interesting comparisons
print("\n" + "="*60)
print("Interesting Team Comparisons:")
print("="*60)

# Find most similar teams
for i, team1 in enumerate(teams):
    similarities = []
    for j, team2 in enumerate(teams):
        if i != j:
            similarities.append((team2, similarity_matrix[i, j]))
    similarities.sort(key=lambda x: x[1], reverse=True)

    print(f"\n{team1}:")
    print(f"  Most similar: {similarities[0][0]} (cos={similarities[0][1]:.3f})")
    print(f"  Least similar: {similarities[-1][0]} (cos={similarities[-1][1]:.3f})")
