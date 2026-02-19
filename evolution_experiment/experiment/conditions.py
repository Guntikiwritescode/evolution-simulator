"""
Three experimental conditions: EVO, OPT, RND.
All use the same simulation engine with the same computational budget.
"""

import numpy as np
from simulator.creature import Creature
from simulator.stage import SquareStage
from simulator.simulation import Simulation, evo_reproduce, clone_reproduce, collect_metrics
from simulator.generation import Generation


# ─── Environment configuration ───────────────────────────────────────────────

TRAIN_STAGE_SIZE = 500
TRAIN_FOOD = 50
TRAIN_GENERATIONS = 100

TRANSFER_STAGE_SIZE = 300
TRANSFER_FOOD = 25
TRANSFER_GENERATIONS = 20
TRANSFER_N_CLUSTERS = 5
TRANSFER_CLUSTER_SD = 30.0

N_CREATURES = 50

DEFAULT_TRAITS = dict(
    speed=(10.0, 0.5),
    size=(10.0, 0.5),
    sense_range=(20.0, 0.5),
    reach=(1.0, 0.0),
    flee_distance=(1e12, 0.0),
    life_span=(1e4, 0.0),
    energy=500.0,
)


def _make_training_food_fn(stage_size, n_food):
    def fn(rng):
        return [rng.uniform(0, stage_size, size=2) for _ in range(n_food)]
    return fn


def _make_transfer_food_fn(stage_size, n_food, n_clusters, cluster_sd):
    def fn(rng):
        centers = [rng.uniform(0, stage_size, size=2) for _ in range(n_clusters)]
        positions = []
        for _ in range(n_food):
            center = centers[rng.integers(n_clusters)]
            pos = center + rng.normal(0, cluster_sd, size=2)
            pos = np.clip(pos, 0.0, stage_size)
            positions.append(pos)
        return positions
    return fn


def _make_creatures(n, stage, rng, **trait_overrides):
    """Create n creatures at random edge positions."""
    traits = {**DEFAULT_TRAITS, **trait_overrides}
    energy = traits.pop('energy')
    creatures = []
    for _ in range(n):
        loc = stage.get_random_location(rng)
        pos = stage.get_nearest_edge_point(loc)
        c = Creature(pos=pos, energy=energy, **traits)
        creatures.append(c)
    return creatures


def _make_creatures_fixed(n, stage, rng, speed_val, size_val, sense_val):
    """Create n creatures with fixed traits (no mutation variance)."""
    creatures = []
    for _ in range(n):
        loc = stage.get_random_location(rng)
        pos = stage.get_nearest_edge_point(loc)
        c = Creature(
            pos=pos,
            speed=(speed_val, 0.0),
            size=(size_val, 0.0),
            sense_range=(sense_val, 0.0),
            reach=(1.0, 0.0),
            flee_distance=(1e12, 0.0),
            life_span=(1e4, 0.0),
            energy=500.0,
        )
        creatures.append(c)
    return creatures


# ─── EVO condition ───────────────────────────────────────────────────────────

def run_evo(seed, progress_prefix="[EVO]"):
    """Run evolutionary condition: natural selection + mutation.
    Returns (train_metrics, transfer_metrics, total_creature_steps)."""
    rng = np.random.default_rng(seed)

    # Training phase
    train_stage = SquareStage(TRAIN_STAGE_SIZE)
    sim = Simulation(train_stage, rng)
    creatures = _make_creatures(N_CREATURES, train_stage, rng)
    food_fn = _make_training_food_fn(TRAIN_STAGE_SIZE, TRAIN_FOOD)

    def prog(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Train Gen {g}/{t}")

    train_metrics, survivors, train_steps = sim.run(
        creatures, TRAIN_GENERATIONS, evo_reproduce, food_fn,
        phase_label="train", progress_fn=prog)

    # Transfer phase
    transfer_stage = SquareStage(TRANSFER_STAGE_SIZE)
    sim_t = Simulation(transfer_stage, rng)
    transfer_creatures = []
    for c in survivors:
        loc = transfer_stage.get_random_location(rng)
        pos = transfer_stage.get_nearest_edge_point(loc)
        new_c = Creature(
            pos=pos,
            speed=c.speed,
            size=c.size,
            sense_range=c.sense_range_trait,
            reach=c.reach_trait,
            flee_distance=c.flee_distance,
            life_span=c.life_span,
            energy=c.energy,
            age=c.age,
        )
        transfer_creatures.append(new_c)

    if not transfer_creatures:
        transfer_creatures = _make_creatures(N_CREATURES, transfer_stage, rng)

    food_fn_t = _make_transfer_food_fn(
        TRANSFER_STAGE_SIZE, TRANSFER_FOOD, TRANSFER_N_CLUSTERS, TRANSFER_CLUSTER_SD)

    def prog_t(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Transfer Gen {g}/{t}")

    transfer_metrics, _, transfer_steps = sim_t.run(
        transfer_creatures, TRANSFER_GENERATIONS, evo_reproduce, food_fn_t,
        phase_label="transfer", progress_fn=prog_t)

    return train_metrics, transfer_metrics, train_steps + transfer_steps


# ─── OPT condition ───────────────────────────────────────────────────────────

def run_opt(seed, evo_budget, progress_prefix="[OPT]"):
    """Run hill-climbing optimization condition.
    Uses evo_budget total creature-steps for the search phase."""
    rng = np.random.default_rng(seed)

    train_stage = SquareStage(TRAIN_STAGE_SIZE)
    food_fn = _make_training_food_fn(TRAIN_STAGE_SIZE, TRAIN_FOOD)

    # Hill-climbing search
    best_speed, best_size, best_sense = 10.0, 10.0, 20.0
    best_score = _evaluate_config(
        best_speed, best_size, best_sense, train_stage, rng, food_fn)

    budget_used = 0
    trait_names = ['speed', 'size', 'sense_range']
    perturbation_sd = 1.0
    iteration = 0

    # Estimate cost of one evaluation (run one to measure)
    eval_cost = _estimate_eval_cost(best_speed, best_size, best_sense,
                                     train_stage, rng, food_fn)
    budget_used += eval_cost

    print(f"  {progress_prefix} Seed {seed}, Hill-climbing (budget={evo_budget})...")

    while budget_used < evo_budget:
        trait_idx = rng.integers(len(trait_names))
        trait = trait_names[trait_idx]
        offset = rng.normal(0, perturbation_sd)

        new_speed, new_size, new_sense = best_speed, best_size, best_sense
        if trait == 'speed':
            new_speed = max(new_speed + offset, 0.01)
        elif trait == 'size':
            new_size = max(new_size + offset, 0.01)
        else:
            new_sense = max(new_sense + offset, 0.0)

        score, cost = _evaluate_config_with_cost(
            new_speed, new_size, new_sense, train_stage, rng, food_fn)
        budget_used += cost

        if score > best_score:
            best_speed, best_size, best_sense = new_speed, new_size, new_sense
            best_score = score

        iteration += 1
        if iteration % 50 == 0:
            print(f"  {progress_prefix} Seed {seed}, Iter {iteration}, "
                  f"budget {budget_used}/{evo_budget}, "
                  f"best_score={best_score:.2f}")

    print(f"  {progress_prefix} Seed {seed}, Search done. "
          f"Best: speed={best_speed:.2f}, size={best_size:.2f}, "
          f"sense={best_sense:.2f}, score={best_score:.2f}")

    # Training phase: deploy best configuration for full run
    sim = Simulation(train_stage, rng)
    creatures = _make_creatures_fixed(
        N_CREATURES, train_stage, rng, best_speed, best_size, best_sense)

    def prog(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Train Gen {g}/{t}")

    train_metrics, survivors, _ = sim.run(
        creatures, TRAIN_GENERATIONS, clone_reproduce, food_fn,
        phase_label="train", progress_fn=prog)

    # Transfer phase
    transfer_stage = SquareStage(TRANSFER_STAGE_SIZE)
    sim_t = Simulation(transfer_stage, rng)
    transfer_creatures = _make_creatures_fixed(
        N_CREATURES, transfer_stage, rng, best_speed, best_size, best_sense)

    food_fn_t = _make_transfer_food_fn(
        TRANSFER_STAGE_SIZE, TRANSFER_FOOD, TRANSFER_N_CLUSTERS, TRANSFER_CLUSTER_SD)

    def prog_t(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Transfer Gen {g}/{t}")

    transfer_metrics, _, _ = sim_t.run(
        transfer_creatures, TRANSFER_GENERATIONS, clone_reproduce, food_fn_t,
        phase_label="transfer", progress_fn=prog_t)

    return train_metrics, transfer_metrics


def _evaluate_config(speed, size, sense, stage, rng, food_fn):
    """Run one generation of clones and return mean food per creature."""
    creatures = _make_creatures_fixed(N_CREATURES, stage, rng, speed, size, sense)
    food_positions = food_fn(rng)
    gen = Generation(creatures, food_positions, stage, rng)
    alive = [c for c in gen.creatures if c.is_alive()]
    total_food = sum(len(c.foods_eaten) for c in gen.creatures)
    return total_food / len(gen.creatures) if gen.creatures else 0.0


def _evaluate_config_with_cost(speed, size, sense, stage, rng, food_fn):
    """Run one generation, return (mean_food, creature_steps)."""
    creatures = _make_creatures_fixed(N_CREATURES, stage, rng, speed, size, sense)
    food_positions = food_fn(rng)
    gen = Generation(creatures, food_positions, stage, rng)
    total_food = sum(len(c.foods_eaten) for c in gen.creatures)
    score = total_food / len(gen.creatures) if gen.creatures else 0.0
    return score, gen.total_creature_steps


def _estimate_eval_cost(speed, size, sense, stage, rng, food_fn):
    """Run one evaluation and return its creature-step cost."""
    creatures = _make_creatures_fixed(N_CREATURES, stage, rng, speed, size, sense)
    food_positions = food_fn(rng)
    gen = Generation(creatures, food_positions, stage, rng)
    return gen.total_creature_steps


# ─── RND condition ───────────────────────────────────────────────────────────

def run_rnd(seed, progress_prefix="[RND]"):
    """Run random baseline: fresh random traits each generation."""
    rng = np.random.default_rng(seed)

    # Training phase
    train_stage = SquareStage(TRAIN_STAGE_SIZE)
    food_fn = _make_training_food_fn(TRAIN_STAGE_SIZE, TRAIN_FOOD)

    def rnd_reproduce(creatures, rng_):
        return _make_random_creatures(N_CREATURES, train_stage, rng_)

    sim = Simulation(train_stage, rng)
    creatures = _make_random_creatures(N_CREATURES, train_stage, rng)

    def prog(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Train Gen {g}/{t}")

    train_metrics, _, _ = sim.run(
        creatures, TRAIN_GENERATIONS, rnd_reproduce, food_fn,
        phase_label="train", progress_fn=prog)

    # Transfer phase
    transfer_stage = SquareStage(TRANSFER_STAGE_SIZE)

    def rnd_reproduce_t(creatures, rng_):
        return _make_random_creatures(N_CREATURES, transfer_stage, rng_)

    sim_t = Simulation(transfer_stage, rng)
    creatures_t = _make_random_creatures(N_CREATURES, transfer_stage, rng)

    food_fn_t = _make_transfer_food_fn(
        TRANSFER_STAGE_SIZE, TRANSFER_FOOD, TRANSFER_N_CLUSTERS, TRANSFER_CLUSTER_SD)

    def prog_t(g, t):
        if g % 10 == 0 or g == t:
            print(f"  {progress_prefix} Seed {seed}, Transfer Gen {g}/{t}")

    transfer_metrics, _, _ = sim_t.run(
        creatures_t, TRANSFER_GENERATIONS, rnd_reproduce_t, food_fn_t,
        phase_label="transfer", progress_fn=prog_t)

    return train_metrics, transfer_metrics


def _make_random_creatures(n, stage, rng):
    """Create creatures with uniformly random traits."""
    creatures = []
    for _ in range(n):
        loc = stage.get_random_location(rng)
        pos = stage.get_nearest_edge_point(loc)
        c = Creature(
            pos=pos,
            speed=(rng.uniform(1, 20), 0.0),
            size=(rng.uniform(1, 20), 0.0),
            sense_range=(rng.uniform(1, 40), 0.0),
            reach=(1.0, 0.0),
            flee_distance=(1e12, 0.0),
            life_span=(1e4, 0.0),
            energy=500.0,
        )
        creatures.append(c)
    return creatures
