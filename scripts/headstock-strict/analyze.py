"""Exact feasibility of straight, equally spaced, same-side tuner posts.

Python 3 + NumPy. SVD is diagnostic only; exact Fraction witnesses and
integer-square-root enclosures decide incompatibility. Sin trucos.
"""
from fractions import Fraction as F
from math import isqrt
from pathlib import Path
import hashlib
import json
import platform
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / 'reference-analysis/headstock-strict-inputs.json'
OUTPUT = ROOT / 'reference-analysis/headstock-strict-results.json'
SQRT_DIGITS = 80


def rational(value):
    return F(value) if isinstance(value, int) else F.from_float(value)


def sqrt_interval(q, digits=SQRT_DIGITS):
    """Exact rational enclosure, no floating-point or Decimal rounding."""
    scale = 10 ** digits
    k = isqrt(q.numerator * scale * scale // q.denominator)
    lo = F(k, scale)
    hi = lo if lo * lo == q else F(k + 1, scale)
    assert lo * lo <= q <= hi * hi
    return lo, hi


def nullspace(matrix):
    """Exact RREF basis. Matrix is small (4 x N); arithmetic is rational."""
    a = [row[:] for row in matrix]
    rows, cols = len(a), len(a[0])
    pivots = []
    r = 0
    for c in range(cols):
        pivot = next((j for j in range(r, rows) if a[j][c]), None)
        if pivot is None:
            continue
        a[r], a[pivot] = a[pivot], a[r]
        den = a[r][c]
        a[r] = [v / den for v in a[r]]
        for j in range(rows):
            if j != r and a[j][c]:
                factor = a[j][c]
                a[j] = [u - factor * v for u, v in zip(a[j], a[r])]
        pivots.append(c)
        r += 1
        if r == rows:
            break
    basis = []
    for c in range(cols):
        if c not in pivots:
            w = [F(0)] * cols
            w[c] = F(1)
            for j, pivot in enumerate(pivots):
                w[pivot] = -a[j][c]
            basis.append(w)
    return basis, len(pivots)


def exact_system(case):
    a, polynomial, lengths = [], [], []
    for i, string in enumerate(case['strings']):
        sx, sy = (rational(string['S'][k]) for k in ['x', 'y'])
        bx, by = (rational(string['B'][k]) for k in ['x', 'y'])
        dx, dy = sx - bx, sy - by
        q = dx * dx + dy * dy
        if not q:
            raise ValueError('Zero-length string')
        a.append([-dy, dx, -i * dy, i * dx])
        polynomial.append(dx * sy - dy * sx)
        lengths.append(sqrt_interval(q))
    return a, polynomial, lengths


def certificate(a, polynomial, lengths, w, sigma, radius):
    assert all(sum(w[i] * a[i][j] for i in range(len(a))) == 0 for j in range(4))
    lower = upper = sum(q * p for q, p in zip(w, polynomial))
    for coeff, (lo, hi) in zip(w, lengths):
        t = coeff * sigma * radius
        lower += t * (lo if t >= 0 else hi)
        upper += t * (hi if t >= 0 else lo)
    gap = lower if lower > 0 else -upper if upper < 0 else F(0)
    # Lower bound on max perpendicular-distance residual for EVERY equal row.
    denominator_upper = sum(abs(q) * hi for q, (_, hi) in zip(w, lengths))
    return {'w': [str(v) for v in w], 'wTimesAExactlyZero': True,
            'wTimesBInterval': [str(lower), str(upper)], 'excludesZero': bool(gap),
            'maxResidualLowerBoundMm': float(gap / denominator_upper)}


def diagnostic(case, sigma, radius):
    s = np.array([[q['S'][k] for k in ['x', 'y']] for q in case['strings']], dtype=float)
    b = np.array([[q['B'][k] for k in ['x', 'y']] for q in case['strings']], dtype=float)
    u = s - b
    u /= np.linalg.norm(u, axis=1)[:, None]
    i = np.arange(case['N'])
    a = np.array([-u[:, 1], u[:, 0], -i * u[:, 1], i * u[:, 0]]).T
    rhs = u[:, 0] * s[:, 1] - u[:, 1] * s[:, 0] + sigma * radius
    scale = np.linalg.norm(a, axis=0)
    scale[scale == 0] = 1
    left, singular, right = np.linalg.svd(a / scale, full_matrices=True)
    rank = int(np.sum(singular > singular[0] * 1e-12))
    coeff = right[:rank].T @ ((left[:, :rank].T @ rhs) / singular[:rank])
    x = coeff / scale
    residual = a @ x - rhs
    return {'scaledSingularValues': singular.tolist(), 'numericRank': rank,
            'rankRelativeThreshold': 1e-12, 'C0AndV': x.tolist(),
            'maxDistanceResidualMm': float(np.max(np.abs(residual))),
            'l2DistanceResidualMm': float(np.linalg.norm(residual)),
            'status': 'diagnostic approximation only; not a feasible layout'}


def physical_oracle(case, sigma, radius):
    """Known solution in a rank-deficient family's free variables."""
    c0 = np.array([40.0, sigma * float(radius)])
    v = np.array([25.0, 7.0])
    centers = np.array([c0 + i * v for i in range(case['N'])])
    contacts = centers - sigma * float(radius) * np.array([0., 1.])
    stations = [contacts[i, 0] - q['S']['x'] for i, q in enumerate(case['strings'])]
    assert min(stations) > 0
    pitch = float(np.linalg.norm(v))
    assert pitch >= 14.505
    min_other = float('inf')
    for i, q in enumerate(case['strings']):
        s = np.array([q['S']['x'], q['S']['y']])
        delta = contacts[i] - s
        assert abs(delta[1]) < 1e-12
        assert abs(np.linalg.norm(contacts[i] - centers[i]) - float(radius)) < 1e-12
        assert abs(np.dot(delta, contacts[i] - centers[i])) < 1e-12
        for j, c in enumerate(centers):
            if i == j:
                continue
            t = np.clip(np.dot(c - s, delta) / np.dot(delta, delta), 0, 1)
            min_other = min(min_other, float(np.linalg.norm(c - (s + t * delta)) - float(radius)))
    assert min_other >= .005
    # Parallel segments at distinct y cannot cross. A finite witness strip
    # has straight sides 10 mm away and end margins 20 mm; washers fit.
    e = v / pitch
    n = np.array([-e[1], e[0]])
    edge_a = centers[0] - 20 * e + 10 * n
    edge_b = centers[-1] + 20 * e + 10 * n
    return {'C0': c0.tolist(), 'v': v.tolist(), 'centers': centers.tolist(),
            'contacts': contacts.tolist(), 'pitchMm': pitch,
            'centerToEdgeMm': 10, 'edge': [edge_a.tolist(), edge_b.tolist()],
            'endMarginMm': 20, 'minForwardMm': min(stations),
            'minOtherPostClearanceMm': min_other, 'stringsCross': False,
            'equalPitch': True, 'straightRow': True, 'constantEdgeDistance': True,
            'postAndWasherFit': True, 'fullM6FitStatus': 'unverified'}


def analyze(case, sigma, radius=F(3)):
    if sigma not in [-1, 1] or radius <= 0:
        raise ValueError('Positive post radius and a named common winding side required')
    a, polynomial, lengths = exact_system(case)
    basis, rank = nullspace([list(col) for col in zip(*a)])
    certs = [certificate(a, polynomial, lengths, w, sigma, radius) for w in basis]
    cert = max(certs, key=lambda c: c['maxResidualLowerBoundMm'], default=None)
    result = {'id': case['id'], 'N': case['N'], 'group': case['group'],
              'sigma': sigma, 'exactRationalRank': rank,
              'diagnostic': diagnostic(case, sigma, float(radius)),
              'certificate': cert, 'physicalChecks': 'not reached'}
    if cert and cert['excludesZero']:
        result['status'] = 'EXACT_LINEAR_INFEASIBLE_CERTIFIED'
    elif case['group'] == 'positive-control':
        witness = physical_oracle(case, sigma, radius)
        x = [rational(t) for t in witness['C0'] + witness['v']]
        for row, poly, (lo, hi) in zip(a, polynomial, lengths):
            assert lo == hi
            assert sum(v * q for v, q in zip(row, x)) == poly + sigma * radius * lo
        result.update(status='EXACT_PHYSICAL_SOLUTION', physicalChecks=witness)
    else:
        # No certificate is not proof that the whole affine family works/fails.
        result['status'] = 'PHYSICAL_UNRESOLVED'
    return result


def generate(data):
    results = [analyze(case, sigma) for case in data['cases'] for sigma in [-1, 1]]
    return {'version': 1, 'method': 'exact rational left-null witness with rational sqrt enclosures',
            'inputInterpretation': 'each stored JSON coordinate parsed as IEEE-754 binary64, then exact Fraction',
            'sqrtAbsoluteIntervalWidthMm': '1e-80',
            'scope': 'specific stored contacts, no finite headstock bound; no continuous-range theorem',
            'row': 'C_i = C0 + i*v, all C0/v coordinates free; radius=3mm, same sigma for all strings',
            'sources': data['sourceHashes'], 'runtime': {'python': platform.python_version(), 'numpy': np.__version__},
            'inputSha256': hashlib.sha256(INPUT.read_bytes()).hexdigest(), 'results': results}


if __name__ == '__main__':
    data = json.loads(INPUT.read_text(encoding='utf-8'))
    output = generate(data)
    OUTPUT.write_text(json.dumps(output, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    actual = [r for r in output['results'] if r['group'] in ['current-default', 'reference', 'boundary-grid']]
    counts = {status: sum(r['status'] == status for r in actual) for status in sorted({r['status'] for r in actual})}
    print(json.dumps({'actualBranches': len(actual), 'statuses': counts,
                      'controls': len(output['results']) - len(actual)}, indent=2))
