# Evolution Experiment

Reproducible experiment accompanying the paper **"Evolving (Artificial) Intelligence"** (Guntaka, A. R., University of California, Berkeley).

This experiment compares evolutionary training, hill-climbing optimization, and random baselines in an agent-based foraging simulation, demonstrating that evolutionary methods produce more generalizable AI agents than fixed-objective optimization.

Built on the open-source [evolution-simulator](https://github.com/yourusername/evolution-simulator) (Rust/WASM). The simulation engine is a faithful Python port of the original mechanics.

## Installation

```bash
cd evolution_experiment
pip install -r requirements.txt
```

Requires Python 3.9+. Dependencies: numpy, matplotlib, scipy, pandas, pytest.

## Running the Experiment

```bash
python -m experiment.run_experiment
```

This single command runs everything:
- All 3 conditions (EVO, OPT, RND) across 30 independent seeds
- Training phase (100 generations, Environment A) and transfer phase (20 generations, Environment B)
- Saves raw data as CSVs
- Runs statistical analysis (Welch's t-tests, Cohen's d, 95% CIs)
- Generates all 5 publication figures

**Expected runtime:** ~30 minutes on a modern laptop.

## Running Tests

```bash
python -m pytest tests/ -v
```

Tests verify:
- Energy cost formula correctness (10.002 for default traits)
- Mutation produces values within expected ranges
- Single-generation deterministic snapshot (seed=42)
- Multi-generation simulation produces expected output
- Determinism: same seed always produces same results

## Output

All results are saved to `results/`:

| File | Description |
|------|-------------|
| `evo_raw.csv` | Per-generation metrics for all EVO seeds |
| `opt_raw.csv` | Per-generation metrics for all OPT seeds |
| `rnd_raw.csv` | Per-generation metrics for all RND seeds |
| `summary_statistics.csv` | Mean ± SD and 95% CI per condition × phase |
| `statistical_tests.csv` | Welch's t-tests, Cohen's d, confidence intervals |
| `fig1_population.png/pdf` | Population size over generations |
| `fig2_mean_food.png/pdf` | Mean food per creature over generations |
| `fig3_trait_evolution.png/pdf` | Trait adaptation in EVO (speed, size, sense range) |
| `fig4_transfer_bars.png/pdf` | Transfer environment performance comparison |
| `fig5_diversity.png/pdf` | Trait diversity (SD) for EVO vs OPT |

## Three Conditions

1. **EVO (Evolutionary):** Natural selection + mutation. Creatures that eat >1 food reproduce with Gaussian-mutated traits. No external optimization.

2. **OPT (Hill-Climbing Optimization):** Same computational budget as EVO. Hill-climbing search over trait space, then deploy best fixed configuration as identical clones. No adaptation.

3. **RND (Random Baseline):** Fresh random traits each generation. No selection, no inheritance.

## Two Environments

- **Environment A (Training):** 500×500 stage, 50 uniformly placed food items, 100 generations.
- **Environment B (Transfer):** 300×300 stage, 25 clustered food items, 20 generations. Tests generalization.

## Citation

> Guntaka, A. R. "Evolving (Artificial) Intelligence." University of California, Berkeley.
