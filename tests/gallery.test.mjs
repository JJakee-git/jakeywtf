import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampCamera,galleryScale} from '../src/gallery-math.mjs';
test('camera cannot expose space outside either canvas edge',()=>{
  assert.equal(clampCamera(150,800,2000),0);
  assert.equal(clampCamera(-1600,800,2000),-1200);
  assert.equal(clampCamera(-400,800,2000),-400);
  assert.equal(clampCamera(-100,800,500),0);
});
test('canvas stays larger than its window at supported viewport sizes',()=>{
  for(const width of [240,320,600,780,1000]){
    const scale=galleryScale(width);
    assert.ok(2400*scale>width);
    assert.ok(1700*scale>width*.62);
  }
});
