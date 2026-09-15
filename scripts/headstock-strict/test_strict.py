"""Bounded verification of the strict experiment, not app regression tests."""
import copy
import hashlib
import json
import unittest
from fractions import Fraction as F
import numpy as np
from analyze import ROOT, INPUT, OUTPUT, generate, analyze, exact_system, rational, sqrt_interval

DATA = json.loads(INPUT.read_text(encoding='utf-8'))
RESULT = json.loads(OUTPUT.read_text(encoding='utf-8'))
BY_ID = {case['id']: case for case in DATA['cases']}


class StrictExperimentTests(unittest.TestCase):
    def test_actual_matrix_and_source_provenance(self):
        cases = [c for c in DATA['cases'] if c['group'] in ['current-default','reference','boundary-grid']]
        self.assertEqual(len(cases), 39)
        self.assertEqual(len(BY_ID), 43)
        self.assertEqual({n: sum(c['N']==n for c in cases) for n in [6,7,8]}, {6:3,7:18,8:18})
        for c in cases:
            self.assertEqual(len(c['strings']), c['N'])
            self.assertEqual(c['params']['stringSpanNut'], (c['N']-1)*c['nutAdjacentMm'])
            self.assertEqual(c['params']['stringSpanBridge'], (c['N']-1)*c['bridgeAdjacentMm'])
            if c['N'] in [7,8]:
                self.assertTrue(6.5 <= c['nutAdjacentMm'] <= 7.5)
                self.assertTrue(10 <= c['bridgeAdjacentMm'] <= 11)
        self.assertEqual(hashlib.sha256(INPUT.read_bytes()).hexdigest(), RESULT['inputSha256'])
        for file, sha in DATA['sourceHashes'].items():
            self.assertEqual(hashlib.sha256((ROOT/file).read_bytes()).hexdigest(), sha)

    def test_every_saved_certificate_is_nonzero_and_exactly_left_null(self):
        count=0
        for row in RESULT['results']:
            if row['status']!='EXACT_LINEAR_INFEASIBLE_CERTIFIED': continue
            a, poly, lengths=exact_system(BY_ID[row['id']])
            cert=row['certificate'];w=[F(t) for t in cert['w']]
            self.assertTrue(any(w))
            for j in range(4): self.assertEqual(sum(w[i]*a[i][j] for i in range(len(a))),0)
            lo=hi=sum(v*p for v,p in zip(w,poly))
            for weight,(low,high) in zip(w,lengths):
                k=weight*row['sigma']*3
                lo+=min(k*low,k*high);hi+=max(k*low,k*high)
            self.assertEqual([str(lo),str(hi)],cert['wTimesBInterval'])
            self.assertTrue(lo>0 or hi<0)
            self.assertGreater(cert['maxResidualLowerBoundMm'],0)
            count+=1
        self.assertEqual(count,80) # 78 actual + 2 negative controls

    def test_positive_rank_deficient_controls_have_explicit_physical_witness(self):
        rows=[r for r in RESULT['results'] if r['group']=='positive-control']
        self.assertEqual(len(rows),6)
        for row in rows:
            self.assertEqual(row['status'],'EXACT_PHYSICAL_SOLUTION')
            self.assertEqual(row['exactRationalRank'],2)
            p=row['physicalChecks'];centers=np.array(p['centers']);edge=np.array(p['edge']);line=edge[1]-edge[0]
            dx=centers-edge[0]
            distances=np.abs(line[0]*dx[:,1]-line[1]*dx[:,0])/np.linalg.norm(line)
            self.assertTrue(np.allclose(distances,10,rtol=0,atol=1e-12))
            self.assertTrue(np.allclose(np.diff(centers,axis=0),p['v'],rtol=0,atol=1e-12))
            self.assertGreater(p['pitchMm'],14.505)
            self.assertGreaterEqual(p['minOtherPostClearanceMm'],.005)
            self.assertGreater(p['minForwardMm'],0)
            # The least-norm diagnostic may be bad; the explicit member works.
            self.assertEqual(p['fullM6FitStatus'],'unverified')

    def test_sqrt_enclosures_and_zero_length_failure(self):
        for q in [F(0),F(1),F(2),F(4),F(17,13),F.from_float(647.7)**2+F(7)**2]:
            lo,hi=sqrt_interval(q)
            self.assertLessEqual(lo*lo,q);self.assertGreaterEqual(hi*hi,q)
            self.assertLessEqual(hi-lo,F(1,10**80))
        broken=copy.deepcopy(DATA['cases'][0]);broken['strings'][0]['B']=broken['strings'][0]['S']
        with self.assertRaises(ValueError):analyze(broken,1)
        with self.assertRaises(ValueError):analyze(DATA['cases'][0],0)
        with self.assertRaises(ValueError):analyze(DATA['cases'][0],1,F(0))

    def test_rigid_rotation_preserves_classification(self):
        case=copy.deepcopy(DATA['cases'][0])
        for q in case['strings']:
            for key in ['S','B']:
                x,y=q[key]['x'],q[key]['y'];q[key]={'x':-y,'y':x}
        for sigma in [-1,1]:self.assertEqual(analyze(case,sigma)['status'],'EXACT_LINEAR_INFEASIBLE_CERTIFIED')

    def test_deterministic_second_full_analysis(self):
        self.assertEqual(generate(DATA),RESULT)

    def test_application_baseline_unchanged(self):
        baseline=json.loads((ROOT/'reference-analysis/headstock-strict-app-baseline.json').read_text(encoding='utf-8-sig'))
        self.assertEqual(len(baseline),56)
        for file,sha in baseline.items():
            self.assertEqual(hashlib.sha256((ROOT/file).read_bytes()).hexdigest(),sha,file)


if __name__=='__main__': unittest.main(verbosity=2)
