"""
All simulation behaviours, ported from the Rust source.
Behaviour order matches primer_behaviours() in api/mod.rs:
  ResetBehaviour, BasicMoveBehaviour, WanderBehaviour, CannibalismBehaviour(0.8),
  ScavengeBehaviour, SatisfiedBehaviour, EdgeHomeBehaviour, StarveBehaviour,
  OldAgeBehaviour.

Each phase function applies behaviours in that order, only calling into
behaviours that are active for that phase.
"""

import math
import numpy as np
from .creature import Objective, ObjectiveIntensity, _dist

AGE_LIMIT_VARIANCE = 1.0
CANNIBALISM_SIZE_RATIO = 0.8
_PI4 = math.pi / 4.0
_NEG_PI4 = -_PI4


# ─── INIT phase ───────────────────────────────────────────────────────────────

def run_init(gen, stage, rng):
    # StarveBehaviour (INIT): kill creatures with speed == 0
    for c in gen.creatures:
        if c.get_speed() == 0.0:
            c.kill()

    # OldAgeBehaviour (INIT): check old age
    for c in gen.creatures:
        if c.is_alive():
            lifetime = rng.normal(c.get_life_span(), AGE_LIMIT_VARIANCE)
            if c.age > lifetime:
                c.kill()


# ─── PRE phase ────────────────────────────────────────────────────────────────

def run_pre(gen, stage, rng):
    # ResetBehaviour: reset objectives for all alive creatures
    for c in gen.creatures:
        if c.is_alive():
            c.reset_objective()

    # EdgeHomeBehaviour: set home positions via nearest edge
    for c in gen.creatures:
        if c.is_alive():
            c.home_pos = stage.compute_edge_home(c.pos)


# ─── ORIENT phase ────────────────────────────────────────────────────────────

def run_orient(gen, stage, rng):
    _orient_wander(gen, stage, rng)
    _orient_cannibalism(gen, stage, rng)
    _orient_scavenge(gen, stage, rng)
    _orient_satisfied(gen, stage, rng)


def _orient_wander(gen, stage, rng):
    """WanderBehaviour: pick a random direction within ±pi/4 of current heading.
    If target is outside stage, head toward center."""
    center = stage.get_center()
    s = stage.size
    for c in gen.creatures:
        if not c.is_active():
            continue
        ang = rng.uniform(_NEG_PI4, _PI4)
        direction = c.get_direction()
        cos_a = math.cos(ang)
        sin_a = math.sin(ang)
        dx = float(direction[0])
        dy = float(direction[1])
        rx = cos_a * dx - sin_a * dy
        ry = sin_a * dx + cos_a * dy
        tx = float(c.pos[0]) + rx
        ty = float(c.pos[1]) + ry
        if 0.0 <= tx <= s and 0.0 <= ty <= s:
            c.add_objective(Objective(
                np.array([tx, ty]), ObjectiveIntensity.MinorCraving, "wandering"))
        else:
            c.add_objective(Objective(
                center, ObjectiveIntensity.MinorCraving, "wandering"))


def _orient_cannibalism(gen, stage, rng):
    """CannibalismBehaviour ORIENT: predators chase prey, prey flee.
    Pair iteration order matches the Rust for_pred_prey_pair method.
    Uses precomputed pairwise distances for performance."""
    creatures = gen.creatures
    N = len(creatures)
    if N < 2:
        return

    positions = np.empty((N, 2))
    sizes = np.empty(N)
    eff_speeds = np.empty(N)
    sense_ranges = np.empty(N)
    flee_dists = np.empty(N)
    active = np.empty(N, dtype=bool)

    for k, c in enumerate(creatures):
        positions[k] = c.pos
        sizes[k] = c.get_size()
        eff_speeds[k] = c.get_speed()
        sense_ranges[k] = c.get_sense_range()
        flee_dists[k] = c.flee_distance[0]
        active[k] = c.is_active()

    diffs = positions[:, np.newaxis, :] - positions[np.newaxis, :, :]
    dist_matrix = np.sqrt(np.sum(diffs * diffs, axis=2))

    target_prey_speed = {}

    for i in range(1, N):
        if not active[i]:
            continue
        pred_idx = i - 1
        for j in range(i, N):
            if not active[j]:
                continue
            pi, pj = pred_idx, j

            if sizes[pi] > sizes[pj]:
                pred_i, prey_i = pi, pj
            else:
                pred_i, prey_i = pj, pi

            if not active[pred_i] or not active[prey_i]:
                continue
            if sizes[pred_i] * CANNIBALISM_SIZE_RATIO < sizes[prey_i]:
                continue

            predator = creatures[pred_i]
            prey = creatures[prey_i]

            d = dist_matrix[pred_i, prey_i]

            if d <= sense_ranges[prey_i] and d < flee_dists[prey_i]:
                ang = rng.uniform(-_NEG_PI4, _PI4)
                dx = float(positions[pred_i, 0] - positions[prey_i, 0])
                dy = float(positions[pred_i, 1] - positions[prey_i, 1])
                cos_a = math.cos(ang)
                sin_a = math.sin(ang)
                noisy = np.array([
                    float(positions[prey_i, 0]) + cos_a * dx - sin_a * dy,
                    float(positions[prey_i, 1]) + sin_a * dx + cos_a * dy,
                ])
                prey.add_objective(
                    Objective(noisy, ObjectiveIntensity.VitalAversion, "running away"))

            if d > sense_ranges[pred_i]:
                continue

            pid = id(predator)
            prey_spd = eff_speeds[prey_i]
            if pid in target_prey_speed:
                if target_prey_speed[pid] <= prey_spd:
                    continue

            target_prey_speed[pid] = prey_spd

            n_eaten = len(predator.foods_eaten)
            if n_eaten == 0:
                intensity = ObjectiveIntensity.VitalCraving
            elif n_eaten == 1:
                intensity = ObjectiveIntensity.ModerateCraving
            else:
                intensity = ObjectiveIntensity.MinorCraving

            predator.add_objective(
                Objective(positions[prey_i].copy(), intensity, "see prey"))


def _orient_scavenge(gen, stage, rng):
    """ScavengeBehaviour ORIENT: hungry creatures look for nearest visible food.
    Uses vectorized distance matrix for performance."""
    available_food = gen.get_available_food()
    if not available_food:
        return

    creatures = gen.creatures
    N = len(creatures)
    M = len(available_food)

    creature_pos = np.empty((N, 2))
    for i, c in enumerate(creatures):
        creature_pos[i] = c.pos

    food_pos = np.empty((M, 2))
    for j, f in enumerate(available_food):
        food_pos[j] = f.position

    diffs = creature_pos[:, np.newaxis, :] - food_pos[np.newaxis, :, :]
    food_dists = np.sqrt(np.sum(diffs * diffs, axis=2))  # (N, M)

    nearest_idx = np.argmin(food_dists, axis=1)
    nearest_dist = food_dists[np.arange(N), nearest_idx]

    for i, c in enumerate(creatures):
        if not c.is_active() or len(c.foods_eaten) >= 2:
            continue
        if nearest_dist[i] <= c.get_sense_range():
            n_eaten = len(c.foods_eaten)
            if n_eaten == 0:
                intensity = ObjectiveIntensity.VitalCraving
            elif n_eaten == 1:
                intensity = ObjectiveIntensity.ModerateCraving
            else:
                intensity = ObjectiveIntensity.MinorCraving
            c.add_objective(Objective(
                available_food[nearest_idx[i]].position.copy(),
                intensity, "see food"))


def _orient_satisfied(gen, stage, rng):
    """SatisfiedBehaviour ORIENT: creatures that ate >1 food head home (MajorCraving).
    Creatures with 1 food delegate to homesick logic.
    Ported from behaviours/satisfied.rs (which calls HomesickBehaviour::how_homesick)."""
    for c in gen.creatures:
        if not c.is_active():
            continue

        n_eaten = len(c.foods_eaten)
        if n_eaten == 0:
            continue

        if n_eaten > 1:
            obj = Objective(c.home_pos.copy(), ObjectiveIntensity.MajorCraving, "satisfied")
        else:
            obj = _how_homesick(c)
            if obj is None:
                continue

        c.add_objective(obj)
        if c.can_reach(c.home_pos):
            c.sleep()


def _how_homesick(creature):
    """HomesickBehaviour::how_homesick — energy-based urgency to return home.
    Ported from behaviours/homesick.rs."""
    dx = float(creature.home_pos[0]) - float(creature.pos[0])
    dy = float(creature.home_pos[1]) - float(creature.pos[1])
    dist = math.sqrt(dx * dx + dy * dy)
    cost = creature.get_motion_energy_cost()
    speed = creature.get_speed()
    if speed == 0.0:
        return Objective(creature.home_pos.copy(), ObjectiveIntensity.VitalCraving, "low energy")
    steps_to_home = dist / speed
    if cost == 0.0:
        return None
    homesick_factor = creature.get_energy_left() / cost - steps_to_home

    if homesick_factor > 10.0:
        return None
    elif homesick_factor > 5.0:
        intensity = ObjectiveIntensity.MinorCraving
    elif homesick_factor > 0.0:
        intensity = ObjectiveIntensity.MajorCraving
    else:
        intensity = ObjectiveIntensity.VitalCraving

    return Objective(creature.home_pos.copy(), intensity, "low energy")


# ─── MOVE phase ──────────────────────────────────────────────────────────────

def run_move(gen, stage, rng):
    """BasicMoveBehaviour: move each active creature one step."""
    s = stage.size
    for c in gen.creatures:
        if not c.is_active():
            continue
        d = c.get_direction()
        spd = c.get_speed()
        nx = float(c.pos[0]) + spd * float(d[0])
        ny = float(c.pos[1]) + spd * float(d[1])
        if nx < 0.0:
            nx = 0.0
        elif nx > s:
            nx = s
        if ny < 0.0:
            ny = 0.0
        elif ny > s:
            ny = s
        c.move_to(np.array([nx, ny]))


# ─── ACT phase ───────────────────────────────────────────────────────────────

def run_act(gen, stage, rng):
    _act_cannibalism(gen)
    _act_scavenge(gen)


def _act_cannibalism(gen):
    """CannibalismBehaviour ACT: predators eat prey they can reach.
    Same pair iteration order as ORIENT. Precomputes distances."""
    creatures = gen.creatures
    N = len(creatures)
    if N < 2:
        return

    positions = np.empty((N, 2))
    sizes = np.empty(N)
    reaches = np.empty(N)
    active = np.empty(N, dtype=bool)

    for k, c in enumerate(creatures):
        positions[k] = c.pos
        sizes[k] = c.get_size()
        reaches[k] = c.get_reach()
        active[k] = c.is_active()

    diffs = positions[:, np.newaxis, :] - positions[np.newaxis, :, :]
    dist_matrix = np.sqrt(np.sum(diffs * diffs, axis=2))

    for i in range(1, N):
        if not active[i]:
            continue
        pred_idx = i - 1
        for j in range(i, N):
            if not active[j]:
                continue

            if sizes[pred_idx] > sizes[j]:
                pred_i, prey_i = pred_idx, j
            else:
                pred_i, prey_i = j, pred_idx

            if not active[pred_i] or not active[prey_i]:
                continue
            if sizes[pred_i] * CANNIBALISM_SIZE_RATIO < sizes[prey_i]:
                continue

            predator = creatures[pred_i]
            prey = creatures[prey_i]

            if dist_matrix[pred_i, prey_i] <= reaches[pred_i]:
                predator.eat_food(gen.steps, "creature")
                prey.kill()
                active[prey_i] = False
            elif predator.can_reach(prey.pos):
                predator.eat_food(gen.steps, "creature")
                prey.kill()
                active[prey_i] = False


def _act_scavenge(gen):
    """ScavengeBehaviour ACT: hungry creatures eat nearest reachable food.
    Sequential processing — once food is eaten, it is unavailable to others."""
    available_food = gen.get_available_food()
    if not available_food:
        return

    creatures = gen.creatures
    N = len(creatures)
    M = len(available_food)

    creature_pos = np.empty((N, 2))
    for i, c in enumerate(creatures):
        creature_pos[i] = c.pos
    food_pos = np.empty((M, 2))
    for j, f in enumerate(available_food):
        food_pos[j] = f.position

    diffs = creature_pos[:, np.newaxis, :] - food_pos[np.newaxis, :, :]
    food_dists = np.sqrt(np.sum(diffs * diffs, axis=2))

    food_eaten_mask = np.zeros(M, dtype=bool)

    for i, c in enumerate(creatures):
        if not c.is_active() or len(c.foods_eaten) >= 2:
            continue

        dists_i = food_dists[i].copy()
        dists_i[food_eaten_mask] = np.inf
        nearest_idx = np.argmin(dists_i)

        if dists_i[nearest_idx] == np.inf:
            continue

        nearest_food = available_food[nearest_idx]
        if nearest_food.is_eaten():
            continue

        if c.can_reach(nearest_food.position):
            c.eat_food(gen.steps, "food")
            nearest_food.mark_eaten(gen.steps)
            food_eaten_mask[nearest_idx] = True


# ─── POST phase ──────────────────────────────────────────────────────────────

def run_post(gen, stage, rng):
    """StarveBehaviour POST: if no food remains, kill active creatures with 0 food."""
    if gen.get_available_food():
        return
    for c in gen.creatures:
        if c.is_active() and len(c.foods_eaten) == 0:
            c.kill()


# ─── FINAL phase ─────────────────────────────────────────────────────────────

def run_final(gen, stage, rng):
    """StarveBehaviour FINAL: kill all alive creatures that ate 0 food."""
    for c in gen.creatures:
        if c.is_alive() and len(c.foods_eaten) == 0:
            c.kill()
