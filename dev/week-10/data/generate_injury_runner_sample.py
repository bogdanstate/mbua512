#!/usr/bin/env python3
"""
Generate sample injury prediction dataset for competitive runners
Based on the structure of: https://www.kaggle.com/datasets/shashwatwork/injury-prediction-for-competitive-runners

This creates synthetic data representing weekly training metrics for runners
"""

import pandas as pd
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)

# Number of athletes and weeks
n_athletes = 30
n_weeks = 12

# Generate athlete IDs
athlete_ids = [f'A{str(i+1).zfill(3)}' for i in range(n_athletes)]

# Create weekly training data for each athlete
data = []

for athlete_id in athlete_ids:
    # Each athlete has a "training style" that influences their metrics
    # Styles: high-volume, high-intensity, balanced, recovery-focused
    style = np.random.choice(['high_volume', 'high_intensity', 'balanced', 'recovery_focused'])

    for week in range(1, n_weeks + 1):
        # Base values depend on training style
        if style == 'high_volume':
            base_distance = np.random.uniform(80, 120)  # km per week
            base_intensity = np.random.uniform(0.6, 0.75)  # normalized intensity
            base_sessions = np.random.randint(6, 9)
            base_recovery = np.random.uniform(6, 7.5)  # hours per day
        elif style == 'high_intensity':
            base_distance = np.random.uniform(50, 80)
            base_intensity = np.random.uniform(0.75, 0.9)
            base_sessions = np.random.randint(5, 7)
            base_recovery = np.random.uniform(7, 8.5)
        elif style == 'balanced':
            base_distance = np.random.uniform(60, 90)
            base_intensity = np.random.uniform(0.65, 0.8)
            base_sessions = np.random.randint(5, 7)
            base_recovery = np.random.uniform(7, 8)
        else:  # recovery_focused
            base_distance = np.random.uniform(40, 70)
            base_intensity = np.random.uniform(0.5, 0.7)
            base_sessions = np.random.randint(4, 6)
            base_recovery = np.random.uniform(8, 9)

        # Add weekly variation (some weeks are harder/easier)
        week_modifier = 1 + np.random.uniform(-0.2, 0.2)

        # Training metrics
        weekly_distance = base_distance * week_modifier
        avg_pace = np.random.uniform(4.5, 6.5)  # min/km
        total_time = weekly_distance * avg_pace  # minutes
        num_sessions = max(1, int(base_sessions * week_modifier))
        high_intensity_sessions = max(0, int(num_sessions * base_intensity))

        # Recovery metrics
        avg_sleep = base_recovery
        resting_hr = np.random.uniform(45, 65)  # bpm
        hrv = np.random.uniform(40, 80)  # ms (heart rate variability)

        # Load metrics
        acute_load = weekly_distance * base_intensity
        fatigue_score = np.random.uniform(3, 8)  # 1-10 scale

        # Performance metrics
        vo2max_estimate = np.random.uniform(45, 65)  # ml/kg/min

        data.append({
            'Athlete_ID': athlete_id,
            'Week': week,
            'Weekly_Distance_km': round(weekly_distance, 2),
            'Total_Training_Time_min': round(total_time, 2),
            'Num_Sessions': num_sessions,
            'High_Intensity_Sessions': high_intensity_sessions,
            'Avg_Pace_min_per_km': round(avg_pace, 2),
            'Avg_Sleep_hours': round(avg_sleep, 2),
            'Resting_Heart_Rate_bpm': round(resting_hr, 1),
            'HRV_ms': round(hrv, 1),
            'Acute_Training_Load': round(acute_load, 2),
            'Fatigue_Score': round(fatigue_score, 1),
            'VO2max_estimate': round(vo2max_estimate, 1)
        })

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
output_path = 'data/injury-runner-timeseries.csv'
df.to_csv(output_path, index=False)

print(f"✓ Generated {len(df)} observations ({n_athletes} athletes × {n_weeks} weeks)")
print(f"✓ Saved to: {output_path}")

# Create aggregated athlete-level data (mean across weeks)
athlete_means = df.groupby('Athlete_ID').agg({
    'Weekly_Distance_km': 'mean',
    'Total_Training_Time_min': 'mean',
    'Num_Sessions': 'mean',
    'High_Intensity_Sessions': 'mean',
    'Avg_Pace_min_per_km': 'mean',
    'Avg_Sleep_hours': 'mean',
    'Resting_Heart_Rate_bpm': 'mean',
    'HRV_ms': 'mean',
    'Acute_Training_Load': 'mean',
    'Fatigue_Score': 'mean',
    'VO2max_estimate': 'mean'
}).reset_index()

athlete_output_path = 'data/injury-runner-sample.csv'
athlete_means.to_csv(athlete_output_path, index=False)

print(f"\n✓ Generated aggregated athlete data: {len(athlete_means)} athletes")
print(f"✓ Saved to: {athlete_output_path}")

# Show sample
print("\n" + "="*70)
print("Sample of athlete-level data (first 5 athletes):")
print("="*70)
print(athlete_means.head().to_string(index=False))

print("\n" + "="*70)
print("Summary statistics:")
print("="*70)
print(athlete_means.describe().round(2))
