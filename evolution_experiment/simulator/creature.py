"""
Creature class: traits, mutation, energy, movement, objectives.
Ported from src/wasm/src/creature/mod.rs and creature/mutatable.rs.
"""

import sys
import math
import numpy as np
from enum import IntEnum
from .math_utils import distance_to_line

ENERGY_COST_SCALE_FACTOR = 1.0 / 10_000.0
FLOAT_MIN_POSITIVE = sys.float_info.min


class ObjectiveIntensity(IntEnum):
    """Ordered lowest to highest, matching the Rust enum derive(PartialOrd)."""
    MinorCraving = 0
    MinorAversion = 1
    ModerateCraving = 2
    ModerateAversion = 3
    MajorCraving = 4
    MajorAversion = 5
    VitalCraving = 6
    VitalAversion = 7


_AVERSION_SET = frozenset({
    ObjectiveIntensity.MinorAversion,
    ObjectiveIntensity.ModerateAversion,
    ObjectiveIntensity.MajorAversion,
    ObjectiveIntensity.VitalAversion,
})


class CreatureState(IntEnum):
    DEAD = 0
    ASLEEP = 1
    ACTIVE = 2


class Objective:
    __slots__ = ('pos', 'intensity', 'reason')

    def __init__(self, pos, intensity, reason):
        self.pos = np.asarray(pos, dtype=np.float64)
        self.intensity = intensity
        self.reason = reason


class Food:
    __slots__ = ('position', 'eaten', 'eaten_step')

    def __init__(self, position):
        self.position = np.asarray(position, dtype=np.float64)
        self.eaten = False
        self.eaten_step = None

    def is_eaten(self):
        return self.eaten

    def mark_eaten(self, step):
        self.eaten = True
        self.eaten_step = step


class Creature:
    """Faithful port of the Rust Creature struct.

    Traits stored as (value, variance) tuples for mutation.
    Default values from src/store/simulation.js:
        speed: (10, 0.5), size: (10, 0.5), sense_range: (20, 0.5),
        reach: (1, 0), flee_distance: (1e12, 0), life_span: (1e4, 0),
        energy: 500
    """

    __slots__ = (
        'pos', 'home_pos', 'speed', 'size', 'sense_range_trait',
        'reach_trait', 'flee_distance', 'life_span', 'energy',
        'energy_consumed', 'age', 'foods_eaten', '_prev_pos',
        'state', 'objective',
        '_eff_speed', '_eff_reach', '_eff_size', '_eff_sense',
        '_energy_cost',
    )

    def __init__(self, pos, speed=(10.0, 0.5), size=(10.0, 0.5),
                 sense_range=(20.0, 0.5), reach=(1.0, 0.0),
                 flee_distance=(1e12, 0.0), life_span=(1e4, 0.0),
                 energy=500.0, age=0):
        self.pos = np.asarray(pos, dtype=np.float64).copy()
        self.home_pos = self.pos.copy()
        self.speed = (float(speed[0]), float(speed[1]))
        self.size = (float(size[0]), float(size[1]))
        self.sense_range_trait = (float(sense_range[0]), float(sense_range[1]))
        self.reach_trait = (float(reach[0]), float(reach[1]))
        self.flee_distance = (float(flee_distance[0]), float(flee_distance[1]))
        self.life_span = (float(life_span[0]), float(life_span[1]))
        self.energy = float(energy)
        self.energy_consumed = 0.0
        self.age = int(age)
        self.foods_eaten = []
        self._prev_pos = None
        self.state = CreatureState.ACTIVE
        self.objective = None
        self._cache_traits()

    def _cache_traits(self):
        self._eff_size = self.size[0]
        self._eff_speed = self.speed[0] * self._eff_size / 10.0
        self._eff_sense = self.sense_range_trait[0]
        self._eff_reach = max(self.reach_trait[0], self._eff_size / 4.0)
        self._energy_cost = ENERGY_COST_SCALE_FACTOR * (
            self._eff_size ** 3 * self._eff_speed ** 2 + self._eff_sense)

    # --- Effective trait accessors (match Rust getters) ---

    def get_speed(self):
        return self._eff_speed

    def get_size(self):
        return self._eff_size

    def get_sense_range(self):
        return self._eff_sense

    def get_reach(self):
        return self._eff_reach

    def get_life_span(self):
        return self.life_span[0]

    # --- Energy ---

    def get_motion_energy_cost(self):
        return self._energy_cost

    def get_energy_left(self):
        return max(self.energy - self.energy_consumed, 0.0)

    def apply_energy_cost(self, cost):
        self.energy_consumed += cost
        if self.get_energy_left() <= 0.0:
            self.state = CreatureState.DEAD

    # --- State queries ---

    def is_alive(self):
        return self.state != CreatureState.DEAD

    def is_active(self):
        return self.state == CreatureState.ACTIVE

    # --- Movement ---

    def move_to(self, pos):
        self._prev_pos = self.pos.copy()
        self.pos = np.asarray(pos, dtype=np.float64).copy()
        self.apply_energy_cost(self.get_motion_energy_cost())

    def get_last_position(self):
        return self._prev_pos

    def get_direction(self):
        if self.objective is not None:
            dx = float(self.objective.pos[0]) - float(self.pos[0])
            dy = float(self.objective.pos[1]) - float(self.pos[1])
            if self.objective.intensity in _AVERSION_SET:
                dx, dy = -dx, -dy
            n = math.sqrt(dx * dx + dy * dy)
            if n != 0.0:
                return np.array([dx / n, dy / n])
        last = self._prev_pos
        if last is not None:
            dx = float(self.pos[0]) - float(last[0])
            dy = float(self.pos[1]) - float(last[1])
            n = math.sqrt(dx * dx + dy * dy)
            if n != 0.0:
                return np.array([dx / n, dy / n])
        return np.array([1.0, 0.0])

    # --- Objectives ---

    def add_objective(self, obj):
        if self.objective is None:
            self.objective = obj
        elif obj.intensity > self.objective.intensity:
            self.objective = obj
        elif obj.intensity == self.objective.intensity:
            ox = float(self.pos[0]) - float(self.objective.pos[0])
            oy = float(self.pos[1]) - float(self.objective.pos[1])
            nx = float(self.pos[0]) - float(obj.pos[0])
            ny = float(self.pos[1]) - float(obj.pos[1])
            if (nx * nx + ny * ny) < (ox * ox + oy * oy):
                self.objective = obj

    def reset_objective(self):
        self.objective = None

    # --- Sensing ---

    def can_see(self, pt):
        dx = float(pt[0]) - float(self.pos[0])
        dy = float(pt[1]) - float(self.pos[1])
        return (dx * dx + dy * dy) <= self.get_sense_range() ** 2

    def can_reach_now(self, pt):
        dx = float(pt[0]) - float(self.pos[0])
        dy = float(pt[1]) - float(self.pos[1])
        return (dx * dx + dy * dy) <= self.get_reach() ** 2

    def can_reach(self, pt):
        reach = self.get_reach()
        dx = float(pt[0]) - float(self.pos[0])
        dy = float(pt[1]) - float(self.pos[1])
        if math.sqrt(dx * dx + dy * dy) <= reach:
            return True
        last = self._prev_pos
        if last is None:
            return False
        r1x = float(self.pos[0])
        r1y = float(self.pos[1])
        r2x = float(last[0])
        r2y = float(last[1])
        px = float(pt[0])
        py = float(pt[1])
        vx = r2x - r1x
        vy = r2y - r1y
        v_norm = math.sqrt(vx * vx + vy * vy)
        if v_norm == 0.0:
            return False
        nx = vx / v_norm
        ny = vy / v_norm
        pax = r1x - px
        pay = r1y - py
        pbx = r2x - px
        pby = r2y - py
        pa_dot_n = pax * nx + pay * ny
        pb_dot_n = pbx * nx + pby * ny
        if pa_dot_n * pb_dot_n > 0.0:
            return False
        proj_x = -pa_dot_n * nx
        proj_y = -pa_dot_n * ny
        diff_x = proj_x - (px - r1x)
        diff_y = proj_y - (py - r1y)
        return math.sqrt(diff_x * diff_x + diff_y * diff_y) <= reach

    def within_flee_distance(self, pt):
        dx = float(pt[0]) - float(self.pos[0])
        dy = float(pt[1]) - float(self.pos[1])
        d_sq = dx * dx + dy * dy
        if d_sq > self.get_sense_range() ** 2:
            return False
        return d_sq < self.flee_distance[0] ** 2

    # --- Actions ---

    def eat_food(self, step, food_type="food"):
        self.foods_eaten.append((step, food_type))

    def sleep(self):
        self.state = CreatureState.ASLEEP

    def kill(self):
        self.state = CreatureState.DEAD

    # --- Reproduction ---

    def mutate(self, rng):
        """Create a mutated offspring at this creature's home position."""
        def _pnz(val, var):
            return max(rng.normal(val, var) if var > 0 else val, FLOAT_MIN_POSITIVE)

        def _pos(val, var):
            return max(rng.normal(val, var) if var > 0 else val, 0.0)

        return Creature(
            pos=self.home_pos.copy(),
            speed=(_pnz(self.speed[0], self.speed[1]), self.speed[1]),
            size=(_pnz(self.size[0], self.size[1]), self.size[1]),
            sense_range=(_pos(self.sense_range_trait[0], self.sense_range_trait[1]),
                         self.sense_range_trait[1]),
            reach=(_pnz(self.reach_trait[0], self.reach_trait[1]), self.reach_trait[1]),
            flee_distance=(_pos(self.flee_distance[0], self.flee_distance[1]),
                           self.flee_distance[1]),
            life_span=(_pnz(self.life_span[0], self.life_span[1]), self.life_span[1]),
            energy=self.energy,
            age=0,
        )

    def grow_older(self):
        """Parent survives to next generation with age + 1."""
        return Creature(
            pos=self.home_pos.copy(),
            speed=self.speed,
            size=self.size,
            sense_range=self.sense_range_trait,
            reach=self.reach_trait,
            flee_distance=self.flee_distance,
            life_span=self.life_span,
            energy=self.energy,
            age=self.age + 1,
        )

    def clone_offspring(self):
        """Identical offspring (for OPT condition). Same traits, age 0."""
        return Creature(
            pos=self.home_pos.copy(),
            speed=self.speed,
            size=self.size,
            sense_range=self.sense_range_trait,
            reach=self.reach_trait,
            flee_distance=self.flee_distance,
            life_span=self.life_span,
            energy=self.energy,
            age=0,
        )


def _dist(a, b):
    """Fast 2D Euclidean distance using Python math (avoids numpy scalar overhead)."""
    dx = float(a[0]) - float(b[0])
    dy = float(a[1]) - float(b[1])
    return math.sqrt(dx * dx + dy * dy)
