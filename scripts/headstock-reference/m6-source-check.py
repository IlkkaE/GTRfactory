"""Check the chosen nominal 2D envelopes against the original PDF vectors."""
import json, hashlib
from pathlib import Path
import pdfplumber

ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'CDR/headstock-research/schaller-m6-mini.pdf'
page=pdfplumber.open(source).pages[0]
factor=25.4/72
profile=json.loads((ROOT/'reference-analysis/m6-mini-fit.json').read_text())['profile']
def points_in_region(x0,x1,y0,y1):
    result=[]
    for item in page.curves+page.lines:
        if item['x0']>=x0 and item['x1']<=x1 and item['top']>=y0 and item['bottom']<=y1:
            result.extend(item['pts'])
    return result
def transform(points,center,mirror=1):
    return [[mirror*(x-center[0])*factor,(y-center[1])*factor] for x,y in points]
def bounds(points):
    return {'xMin':min(p[0] for p in points),'xMax':max(p[0] for p in points),'yMin':min(p[1] for p in points),'yMax':max(p[1] for p in points)}
def contains(envelope,points):
    b=bounds([[p['x'],p['y']] for p in envelope])
    return all(b['xMin']<=x<=b['xMax'] and b['yMin']<=y<=b['yMax'] for x,y in points)
# Regions and centers are the upper-left cover and middle mounting-face projections.
back=transform(points_in_region(80,150,176,218.1),(118.7945,197.472),-1)
mount=transform(points_in_region(238,304,178,217),(269.155,197.472))
button=transform(points_in_region(262,315,106,151.2),(269.155,197.472))
assert len(back)>100 and len(mount)>100 and len(button)>100
assert contains(profile['bodyEnvelope'],back+mount)
assert contains(profile['buttonSweepEnvelope'],button)
# Independent scale anchors: Ø6 post and specified 18.5 mm generic button width.
postDiameterMm=(277.659-260.651)*factor
buttonWidthMm=(314.4891-262.0881)*factor
assert abs(postDiameterMm-6)<0.001
assert abs(buttonWidthMm-18.5)<0.015
result={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pdfUnitToMm':factor,'postDiameterMm':postDiameterMm,'buttonWidthMm':buttonWidthMm,'backBoundsMm':bounds(back),'mountBoundsMm':bounds(mount),'buttonBoundsMm':bounds(button),'checkedVectorPoints':{'back':len(back),'mount':len(mount),'button':len(button)},'conservativeEnvelopeContainsAllSelectedVectorPoints':True,'limits':'Regions describe this source revision only; annotations were excluded by region. This checks nominal PDF geometry, not manufacturing tolerances or a production sample.'}
(ROOT/'reference-analysis/m6-mini-source-check.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
