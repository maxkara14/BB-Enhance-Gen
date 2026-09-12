// A regular icosahedron, projected into SVG. Animation never determines the roll.
const phi = (1 + Math.sqrt(5)) / 2;
const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const sub = (a, b) => a.map((n, i) => n - b[i]);
const unit = a => a.map(n => n / Math.hypot(...a));
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export const vertices = [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],
    [1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[phi,0,-1],[-phi,0,1],[-phi,0,-1]].map(unit);
const edge = Math.hypot(...sub(vertices[0], vertices[1]));
const adjacent = (a, b) => Math.abs(Math.hypot(...sub(vertices[a], vertices[b])) - edge) < 1e-8;
export const faces = [];
for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) for (let c = b + 1; c < 12; c++) {
    if (adjacent(a,b) && adjacent(a,c) && adjacent(b,c)) faces.push([a,b,c]);
}
const center = points => [0,1,2].map(axis => points.reduce((sum,p) => sum+p[axis],0)/points.length);
const front = faces[0].map(i => vertices[i]);
const zAxis = unit(center(front));
const yAxis = unit(sub(center(front), front[0]));
const xAxis = unit(cross(yAxis, zAxis));
const oriented = vertices.map(p => [dot(p,xAxis),dot(p,yAxis),dot(p,zAxis)]);

export function createD20(value) {
    if (!Number.isInteger(value) || value < 1 || value > 20) throw new RangeError('D20 result must be 1–20');
    const ns = 'http://www.w3.org/2000/svg';
    const element = document.createElementNS(ns, 'svg'); element.setAttribute('viewBox','0 0 240 240');
    element.classList.add('bb-eg-d20'); element.setAttribute('aria-hidden','true');
    const nodes = faces.map((face, index) => {
        const group = document.createElementNS(ns,'g');
        const polygon = document.createElementNS(ns,'polygon');
        const text = document.createElementNS(ns,'text'); text.textContent = String((value - 1 + index) % 20 + 1);
        text.setAttribute('text-anchor','middle'); text.setAttribute('dominant-baseline','central');
        group.append(polygon,text); element.append(group); return {face,index,group,polygon,text};
    });
    let frame = null, destroyed = false;
    function draw(progress) {
        const angle = Math.pow(1-progress,3) * Math.PI * 4;
        const cx=Math.cos(angle),sx=Math.sin(angle),cy=Math.cos(angle*.7),sy=Math.sin(angle*.7);
        const points = oriented.map(([x,y,z]) => {
            const ry=y*cx-z*sx,rz=y*sx+z*cx;
            return [x*cy+rz*sy,ry,rz*cy-x*sy];
        });
        const project = ([x,y,z]) => [120 + x*92*3/(3-z),120 - y*92*3/(3-z)];
        nodes.map(node => ({...node,points:node.face.map(i=>points[i])}))
            .sort((a,b)=>center(a.points)[2]-center(b.points)[2]).forEach(node => {
                const middle=center(node.points),[tx,ty]=project(middle);
                const facing=dot(unit(middle),unit(sub([0,0,3],middle)));
                node.group.style.display=facing>0?'':'none';
                node.text.style.visibility=facing>.3?'visible':'hidden';
                const light=Math.max(0,middle[2]);
                node.polygon.setAttribute('points',node.points.map(p=>project(p).join(',')).join(' '));
                node.polygon.setAttribute('fill',`rgb(${24+Math.round(light*40)},${23+Math.round(light*13)},${29+Math.round(light*18)})`);
                node.text.setAttribute('x',String(tx));node.text.setAttribute('y',String(ty));
                node.text.setAttribute('font-size',node.index===0&&progress===1?'27':'13');
                node.text.setAttribute('fill',node.index===0&&progress===1?'#f3e2e6':'#a5808a');
                element.append(node.group);
            });
    }
    function stop() { if (frame !== null) cancelAnimationFrame(frame); frame=null; }
    function reveal() { stop(); if (!destroyed) { draw(1); element.dataset.result=String(value); } }
    function start() {
        if (destroyed) return;
        stop();delete element.dataset.result;
        const started=performance.now();
        const tick=now=>{ if(destroyed)return;const progress=Math.min(1,(now-started)/1200);draw(progress);frame=progress<1?requestAnimationFrame(tick):null; };
        frame=requestAnimationFrame(tick);
    }
    draw(1);
    return { element, start, reveal, destroy() { destroyed=true;stop(); } };
}
