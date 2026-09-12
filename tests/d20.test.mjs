import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vertices,faces} from '../d20.js';

test('D20 is a closed regular icosahedron: 12 vertices, 30 edges, 20 equal triangular faces',()=>{
    assert.equal(vertices.length,12);assert.equal(faces.length,20);
    const edges=new Map();const lengths=[];
    for(const face of faces){
        assert.equal(new Set(face).size,3);
        for(let i=0;i<3;i++){
            const a=face[i],b=face[(i+1)%3],key=[a,b].sort((x,y)=>x-y).join(',');
            edges.set(key,(edges.get(key)||0)+1);
            lengths.push(Math.hypot(...vertices[a].map((n,j)=>n-vertices[b][j])));
        }
    }
    assert.equal(edges.size,30);assert.ok([...edges.values()].every(n=>n===2));
    assert.ok(lengths.every(n=>Math.abs(n-lengths[0])<1e-8));
    assert.ok(vertices.every(p=>Math.abs(Math.hypot(...p)-1)<1e-8));
});
